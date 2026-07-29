import { inject, injectable } from "tsyringe";
import { InviteRepository, UserRepository, CompanyRepository } from "../dal";
import { IInviteRequest, IInviteCreateRequest, IInviteResponse, ITokenUser, Actions, InviteStatus, InviteExpiryDuration, InviteRole, IBulkInviteCreateRequest, IBulkInviteResponse, IInviteRequestBody } from "../models";
import { Invite } from "../entities";
import { AppError } from '../utility/app-error';
import { generateInviteToken, verifyInviteToken } from '../utility/jwt-utility';
import { sendInviteEmail } from '../utility/mail-utility';
import { DefaultRoles } from '../constants/roles';
import { Service } from "./generics/service";

@injectable()
export class InviteService extends Service<Invite, IInviteResponse, IInviteRequest> {
    constructor(
        @inject('InviteRepository') private readonly inviteRepository: InviteRepository,
        @inject('UserRepository') private readonly userRepository: UserRepository,
        @inject('CompanyRepository') private readonly companyRepository: CompanyRepository
    ) {
        super(inviteRepository, () => new Invite())
    }

    async add(request: IInviteCreateRequest, contextUser: ITokenUser): Promise<IInviteResponse> {
        return await this.addSingleInvite(request, contextUser);
    }

    async createInvites(request: IInviteRequestBody, contextUser: ITokenUser): Promise<IInviteResponse | IBulkInviteResponse> {
        // Check if it's a bulk request (has 'invites' property)
        if ('invites' in request) {
            return await this.addBulkInvites(request, contextUser);
        } else {
            // Single invite
            return await this.addSingleInvite(request, contextUser);
        }
    }

    async addSingleInvite(request: IInviteCreateRequest, contextUser: ITokenUser): Promise<IInviteResponse> {
        let targetCompanyId: string;

        // Check if user is super admin
        if (contextUser.role === DefaultRoles.SuperAdmin) {
            // Super admin must provide companyId in request
            if (!request.companyId) {
                throw new AppError("Super admin must provide companyId in the request", "400");
            }
            targetCompanyId = request.companyId;
        } else {
            // Regular users use their own companyId
            if (!contextUser.companyId) {
                throw new AppError("User is not associated with any company", "400");
            }
            
            // If regular user tries to specify a different companyId, ignore it and use their own
            if (request.companyId && request.companyId !== contextUser.companyId) {
                console.warn(`User ${contextUser.id} tried to create invite for different company. Using user's companyId instead.`);
            }
            
            targetCompanyId = contextUser.companyId;
        }

        // Create the internal request with determined companyId
        const internalRequest: IInviteCreateRequest = {
            email: request.email,
            role: request.role || InviteRole.ADMIN, // Default to Admin if not specified
            companyId: targetCompanyId,
            salary: request.salary,
            benefits: request.benefits,
            departmentId: request.departmentId
        };

        // Call the internal createInvite function
        return await this.createInvite(internalRequest, contextUser);
    }

    async addBulkInvites(request: IBulkInviteCreateRequest, contextUser: ITokenUser): Promise<IBulkInviteResponse> {
        const successful: IInviteResponse[] = [];
        const failed: Array<{ email: string; role: InviteRole; error: string }> = [];

        // Process each invite individually
        for (const inviteRequest of request.invites) {
            try {
                let targetCompanyId: string;

                // Determine target company ID for each invite based on user role and request
                if (contextUser.role === DefaultRoles.SuperAdmin) {
                    // Super admin must provide companyId in each invite request
                    if (!inviteRequest.companyId) {
                        throw new AppError("Super admin must provide companyId for each invite", "400");
                    }
                    targetCompanyId = inviteRequest.companyId;
                } else {
                    // Regular users use their own companyId
                    if (!contextUser.companyId) {
                        throw new AppError("User is not associated with any company", "400");
                    }
                    
                    // If regular user tries to specify a different companyId, ignore it and use their own
                    if (inviteRequest.companyId && inviteRequest.companyId !== contextUser.companyId) {
                        console.warn(`User ${contextUser.id} tried to create invite for different company. Using user's companyId instead.`);
                    }
                    
                    targetCompanyId = contextUser.companyId;
                }

                // Create internal request with determined companyId
                const internalRequest: IInviteCreateRequest = {
                    email: inviteRequest.email,
                    role: inviteRequest.role || InviteRole.ADMIN, // Default to Admin if not specified
                    companyId: targetCompanyId,
                    salary: inviteRequest.salary,
                    benefits: inviteRequest.benefits,
                    departmentId: inviteRequest.departmentId
                };

                const inviteResponse = await this.createInvite(internalRequest, contextUser);
                successful.push(inviteResponse);
            } catch (error) {
                const errorMessage = error instanceof AppError ? error.message : 'Unknown error occurred';
                failed.push({
                    email: inviteRequest.email,
                    role: inviteRequest.role || InviteRole.ADMIN, // Default to Admin if not specified
                    error: errorMessage
                });
            }
        }

        return {
            successful,
            failed,
            totalProcessed: request.invites.length,
            successCount: successful.length,
            failureCount: failed.length
        };
    }

    async resendInvite(inviteId: string, contextUser: ITokenUser): Promise<IInviteResponse> {
        // Find the existing invite
        const existingInvite = await this.inviteRepository.firstOrDefault({
            where: { id: inviteId, deleted: false }
        });

        if (!existingInvite) {
            throw new AppError("Invite not found", "404");
        }

        // Check if user has permissions to resend this invite
        if (contextUser.role !== DefaultRoles.SuperAdmin && existingInvite.companyId !== contextUser.companyId) {
            throw new AppError("You don't have permission to resend this invite", "403");
        }

        // If already accepted, throw error
        if (existingInvite.status === InviteStatus.ACCEPTED) {
            throw new AppError("Cannot resend an accepted invite", "400");
        }

        // Extract salary, benefits, and departmentId from existing token if available
        let existingSalary: number | undefined;
        let existingBenefits: any[] | undefined;
        let existingDepartmentId: string | undefined;

        try {
            const existingTokenData = verifyInviteToken(existingInvite.token);
            existingSalary = existingTokenData.salary;
            existingBenefits = existingTokenData.benefits;
            existingDepartmentId = existingTokenData.departmentId;
        } catch (error) {
            // If token verification fails, continue without salary/benefits/departmentId
            console.warn('Could not extract salary/benefits/departmentId from existing token:', error);
        }

        // Generate a new invite token
        const inviteToken = generateInviteToken({
            email: existingInvite.email,
            role: existingInvite.role,
            companyId: existingInvite.companyId,
            inviteId: existingInvite.id,
            createdBy: contextUser?.id,
            salary: existingSalary,
            benefits: existingBenefits,
            departmentId: existingDepartmentId
        });
        
        // Calculate new expiry date
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + InviteExpiryDuration.ONE_WEEK);
        
        // Use partialUpdate to update only the necessary fields
        const partialUpdateData: Partial<IInviteRequest> = {
            status: InviteStatus.PENDING,
            expiresAt: newExpiryDate,
            token: inviteToken,
            acceptedAt: undefined
        };
        
        // Update the invite using the partialUpdate method
        const updatedInvite = await this.partialUpdate(inviteId, partialUpdateData, contextUser);
        
        // Re-fetch the updated invite with all its fields
        const refreshedInvite = await this.inviteRepository.firstOrDefault({
            where: { id: inviteId, deleted: false }
        });
        
        if (!refreshedInvite) {
            throw new AppError("Failed to retrieve updated invite", "500");
        }
        
        // Send email for the resent invite
        this.sendInviteEmailNotification(refreshedInvite, contextUser, true);
        
        return updatedInvite;
    }

    async createInvite(request: IInviteCreateRequest, contextUser?: ITokenUser): Promise<IInviteResponse> {
        // The internal system/super-admin company can only ever contain the super admin
        const targetCompany = await this.companyRepository.firstOrDefault({
            where: { id: request.companyId }
        });
        if (targetCompany?.isSystemCompany) {
            throw new AppError("Cannot invite users to the system company", "400");
        }

        // Check if user with this email already exists in the company
        const existingUser = await this.userRepository.firstOrDefault({
            where: { email: request.email, companyId: request.companyId, active: true, deleted: false }
        });
        
        if (existingUser) {
            throw new AppError("User with this email already exists in this company", "400");
        }

        // Check if there's already a pending invite for this email and company
        const existingInvite = await this.inviteRepository.findByEmail(request.email, request.companyId);
        if (existingInvite && existingInvite.isValid()) {
            throw new AppError("Pending invite already exists for this email", "400");
        }

        // Cancel any existing pending invites for this email and company
        if (existingInvite) {
            existingInvite.markAsCancelled();
            await this.inviteRepository.invokeDbOperations(existingInvite, Actions.Update);
        }

        // Create new invite using the updated fromRequest method
        const invite = new Invite().toEntity({
            email: request.email,
            role: request.role,
            companyId: request.companyId
        }, undefined, contextUser);

        // Generate JWT token for invite
        const tokenPayload = {
            email: invite.email,
            role: invite.role,
            companyId: invite.companyId,
            inviteId: invite.id,
            createdBy: contextUser?.id,
            salary: request.salary,
            benefits: request.benefits,
            departmentId: request.departmentId
        };
        
        const inviteToken = generateInviteToken(tokenPayload);
        
        // Set the JWT token to the invite
        invite.token = inviteToken;
        
        // Save invite
        await this.inviteRepository.invokeDbOperations(invite, Actions.Add);

        // Send email for the new invite
        this.sendInviteEmailNotification(invite, contextUser);

        return invite.toResponse();
    }
    
    /**
     * Sends an email notification for an invite
     */
    private async sendInviteEmailNotification(invite: Invite, contextUser?: ITokenUser, isResend: boolean = false): Promise<void> {
        // Generate invite link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const inviteLink = `${baseUrl}/signup-invite?token=${invite.token}`;
        
        console.log(`${isResend ? 'New' : ''} Invite link generated: ${inviteLink}`);
        
        // Get company details for email
        const company = await this.companyRepository.firstOrDefault({
            where: { id: invite.companyId, active: true, deleted: false }
        });
        
        if (!company) {
            throw new AppError("Company not found", "404");
        }
        
        // Get inviter details if available
        let inviterName: string | undefined;
        if (contextUser) {
            inviterName = contextUser.name;
        }
        
        // Send invitation email
        try {
            await sendInviteEmail(invite.email, {
                email: invite.email,
                role: invite.role,
                companyName: company.name,
                inviteLink: inviteLink,
                invitedBy: inviterName,
                companyDescription: company.address ? `Located at: ${company.address}` : undefined,
                supportEmail: process.env.SUPPORT_EMAIL || company.email || undefined
            });
            console.log(`Invitation email ${isResend ? 'resent' : 'sent'} successfully to ${invite.email}`);
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
            // Don't throw error here - invite is still created/updated even if email fails
        }
    }
}

