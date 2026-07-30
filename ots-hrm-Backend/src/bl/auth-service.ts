import { inject, injectable } from "tsyringe";
import { CompanyRepository, RoleRepository, UserRepository, VerificationRepository, InviteRepository, EmployeeRepository, EmployeeBenefitRepository } from "../dal";
import { Actions, FilterMatchModes, FilterOperators, IForgotPasswordRequest, ILoginRequest, IResendCodeRequest, IResetPasswordRequest, ISignUpRequest, IUserResponse, IVerifyRequest, IInviteSignUpRequest } from "../models";
import { Company, Role, User, Verification, Invite, Employee, EmployeeBenefit } from "../entities";
import { randomUUID, randomInt } from "crypto";
import { compareHash, encrypt, signJwt, verifyInviteToken, verifySetPasswordToken } from "../utility";
import { generateEmployeeCode } from "../utility/employee-code";
import { FastifyError } from 'fastify'
import { EmptyGuid, DefaultRoles } from "../constants";
import { ILike, QueryRunner } from "typeorm";
import { AppError } from '../utility/app-error';
import { PrivilegeService } from "./privilege-service";
import { sendForgotPasswordCode, sendVerificationEmail } from "../utility/mail-utility";
import { VerificationTypes, InviteStatus, InviteRole, EmployeeStatus } from "../models";

@injectable()
export class AuthService {

    constructor(
        @inject('UserRepository') private readonly userRepository: UserRepository,
        @inject('CompanyRepository') private readonly companyRepository: CompanyRepository,
        @inject('RoleRepository') private readonly roleRepository: RoleRepository,
        @inject('PrivilegeService') private readonly privilegeService: PrivilegeService,
        @inject('VerificationRepository') private readonly verificationRepository: VerificationRepository,
        @inject('InviteRepository') private readonly inviteRepository: InviteRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
        @inject('EmployeeBenefitRepository') private readonly employeeBenefitRepository: EmployeeBenefitRepository,
    ) {}
    
    async login(loginRequest: ILoginRequest): Promise<IUserResponse & { token: string }> {
        let user: User | null = null;
            user = await this.userRepository.firstOrDefault({ 
                where: [{userName: loginRequest.userName}, { email: ILike(loginRequest.userName) }], 
                relations: { company: true, role: true, employee: true }
            });
        if (!user) {
            throw new AppError('Invalid username or password', '401');
        }

        // Check if company is active
        if (!user.company?.active) {
            throw new AppError('Your company is not active. Please contact your admin.', '403');
        }

        // Check if user is active
        if (!user.active) {
            throw new AppError('Your account is inactive. Please contact your admin.', '403');
        }

        // Check if the user is email verified
        if (!user.isEmailVerified) {
            throw new AppError('Email not verified', '401');
        }   

        const match = await compareHash(loginRequest.password, user.passwordHash ?? '');

        if (!match) { 
            throw new AppError('Invalid username or password', '401');
        }

        await this.userRepository.partialUpdate(user.id, { lastLogin: new Date() });

        return {
            ...user.toResponse(user),
            token: signJwt({
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                companyId: user.companyId,
                roleId: user.roleId,
                role: user.role?.code ?? '',
                employeeId: user.employee?.id ?? undefined,
                privileges: user.role?.privileges.map((p) => p.code) ?? []
            })
        };
    }
    
    async loginWithGoogle(email: string, accessToken: string, refreshToken: string): Promise<IUserResponse & {token: string}> {
        let user = await this.userRepository.getOneByQuery({filters:[{field: 'email', value: email, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal, ignoreCase: true}], relations: {company: true, role: true}});
        let error: FastifyError = {code: '401', message: 'Invalid username or password', name: 'Unauthorized'};

        if (!user) throw new Error('Invalid username or password',  error);
        
        // Check if company is active
        if (!user.company?.active) {
            throw new AppError('Your company is not active. Please contact your admin.', '403');
        }

        // Check if user is active
        if (!user.active) {
            throw new AppError('Your account is inactive. Please contact your admin.', '403');
        }
        
        await this.userRepository.partialUpdate(user.id, {lastLogin: new Date(), googleAccessToken: accessToken, googleRefreshToken: refreshToken});
        return {...user.toResponse(user), token: signJwt({
            id: user.id, 
            name: `${user.firstName} ${user.lastName}`,  
            companyId: user.companyId,
            roleId: user.roleId,
            role: user.role?.code ?? '',
            employeeId: user.employee?.id ?? undefined,
            privileges: []
        }
        )};
    }

    async signUp(signUpRequest: ISignUpRequest): Promise<IUserResponse & { token: string }> {
        try {
            // Create company
            const company = this.createCompanyFromRequest(signUpRequest);
            await this.companyRepository.invokeDbOperations(company, Actions.Add);

            // Get Privileges
            const modules: string[] = ["Users", "Roles"];
            const privilegeIds = await this.privilegeService.getPrivilegeIdsByModules(modules);

            // Create role
            let role = this.createCompanyAdminRole(company.id, company, privilegeIds);
            await this.roleRepository.invokeDbOperations(role, Actions.Add);

            // Create user
            const user = await this.createUserFromRequest(signUpRequest, company, role);
            const addedUser = await this.userRepository.invokeDbOperations(user, Actions.Add);

            // Create verification record
            const resultVerification = this.createVerificationRecord(addedUser, VerificationTypes.AccountVerify);
            await this.verificationRepository.invokeDbOperations(resultVerification.verification, Actions.Add);

            // Prepare response and token
            const responseUser = addedUser.toResponse();
            responseUser.company = company.toResponse();
            responseUser.role = role.toResponse();
            
            const token = signJwt({
                id: responseUser.id,
                name: `${responseUser.firstName} ${responseUser.lastName}`,
                companyId: responseUser.companyId ?? "",
                roleId: responseUser.roleId ?? "",
                role: responseUser.role?.code,
                employeeId: user.employee?.id ?? undefined,
                privileges: []
            });

            // Send verification email
            sendVerificationEmail(addedUser.email, {
                name: `${addedUser.firstName} ${addedUser.lastName}`,
                code: resultVerification.code,
            });
            
            return { ...responseUser, token };

        } catch (error) {
            throw error;
        }
    }

    async signUpWithGoogle(signUpRequest: ISignUpRequest, accessToken: string, refreshToken: string): Promise<IUserResponse & {token: string}> {
        let user = (await this.createNewUserCompany(signUpRequest, true));
        user.googleAccessToken = accessToken;
        user.googleRefreshToken = refreshToken;
        let addedUser: User = new User
        try {
            addedUser = await this.userRepository.invokeDbOperations(user, Actions.Add);
        } catch (error) {
            throw error;
        }
        let responseUser = addedUser.toResponse();
        responseUser.company = user.company?.toResponse();
        responseUser.role = user.role?.toResponse();
        return {...responseUser, token: signJwt({
            id: responseUser.id, 
            name: `${responseUser.firstName} ${responseUser.lastName}`, 
            companyId: responseUser.companyId ?? "", 
            roleId: responseUser.roleId ?? "",
            role: responseUser.role?.code ?? '',
            privileges: []})};
    }

    async verify(query: IVerifyRequest): Promise<IUserResponse> {
        const { userId, code, whichPurpose } = query;
        const [user, verification] = await Promise.all([
            this.userRepository.getOneByQuery({
                filters: [{ field: 'id', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }],
                relations: { company: true, role: true }
            }),
            this.verificationRepository.firstOrDefault({ 
                where: { userId, code },
                order: { createdAt: 'DESC' },
             })
        ]);

        if (!user) throw new AppError('User not found', '404');
        if (!verification) throw new AppError('Verification record not found', '404');
        if (verification.whichPurpose !== whichPurpose) throw new AppError('Verification record not found', '404');
        if (verification.verified) throw new AppError('User already verified', '400');
        if (verification.expiresAt < new Date()) throw new AppError('Verification code has expired', '400');
        if (verification.code !== code) throw new AppError('Invalid verification code', '400');

        if (whichPurpose === VerificationTypes.AccountVerify) {
            user.isEmailVerified = true;
            verification.verified = true;

            await Promise.all([
                this.userRepository.invokeDbOperations(user, Actions.Update),
                this.verificationRepository.invokeDbOperations(verification, Actions.Update)
            ]);
        }

        return user.toResponse();
    }

    async resendCode(query: IResendCodeRequest): Promise<IUserResponse> {
        const { email, whichPurpose } = query;

        const user = await this.userRepository.getOneByQuery({
            filters: [{ field: 'email', value: email, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }]
        });

        if (!user) throw new AppError('User not found', '404');

        // Create verification record
        const resultVerification = this.createVerificationRecord(user, whichPurpose);
        await this.verificationRepository.invokeDbOperations(resultVerification.verification, Actions.Add);

        if (whichPurpose === VerificationTypes.AccountVerify) {
            // Send verification email
            sendVerificationEmail(user.email, {
                name: `${user.firstName} ${user.lastName}`,
                code: resultVerification.code,
            });
        } else if (whichPurpose === VerificationTypes.ForgotPassword) {
            // Send forgot password email
            sendForgotPasswordCode(user.email, {
                name: `${user.firstName} ${user.lastName}`,
                code: resultVerification.code,
            });
        }

        return user.toResponse();
    }

    async forgotPassword(query: IForgotPasswordRequest): Promise<IUserResponse> {
        const { email } = query;
        const user = await this.userRepository.getOneByQuery({
            filters: [{ field: 'email', value: email, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }]
        });

        if (!user) throw new AppError('User not found', '404');

        // Create verification record
        const resultVerification = this.createVerificationRecord(user, VerificationTypes.ForgotPassword);
        await this.verificationRepository.invokeDbOperations(resultVerification.verification, Actions.Add);

        // Send forgot password email
        sendForgotPasswordCode(user.email, {
            name: `${user.firstName} ${user.lastName}`,
            code: resultVerification.code,
        });

        return user.toResponse();
    }

    async resetPassword(query: IResetPasswordRequest): Promise<IUserResponse> {
        const { userId, code, newPassword } = query;

        const user = await this.userRepository.getOneByQuery({
            filters: [{ field: 'id', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }]
        });

        if (!user) throw new AppError('User not found', '404');

        const verification = await this.verificationRepository.firstOrDefault({
            where: { userId: user.id, whichPurpose: VerificationTypes.ForgotPassword },
            order: { createdAt: 'DESC' },
        });

        if (!verification) throw new AppError('Verification record not found', '404');
        if (verification.verified) throw new AppError('User already verified', '400');
        if (verification.expiresAt < new Date()) throw new AppError('Verification code has expired', '400');
        if (verification.code !== code) throw new AppError('Invalid verification code', '400');

        user.passwordHash = await encrypt(newPassword);
        verification.verified = true;

        await Promise.all([
            this.userRepository.invokeDbOperations(user, Actions.Update),
            this.verificationRepository.invokeDbOperations(verification, Actions.Update)
        ]);

        return user.toResponse();
    }

    // Lets an Employee set their own password from the "Set Your Password" link sent in the
    // welcome email (see EmployeeService.add). The token proves the request came from that
    // email link, so no separate OTP code is needed — unlike the forgot-password flow.
    async setPasswordViaToken(token: string, newPassword: string): Promise<IUserResponse> {
        let decodedToken: any;
        try {
            decodedToken = verifySetPasswordToken(token);
        } catch (error) {
            throw new AppError('This link is invalid or has expired. Please ask your admin to resend it.', '400');
        }

        if (decodedToken.type !== 'set-password' || !decodedToken.userId) {
            throw new AppError('This link is invalid or has expired. Please ask your admin to resend it.', '400');
        }

        const user = await this.userRepository.getOneByQuery({
            filters: [{ field: 'id', value: decodedToken.userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }]
        });

        if (!user) throw new AppError('User not found', '404');

        user.passwordHash = await encrypt(newPassword);
        user.isEmailVerified = true;

        await this.userRepository.invokeDbOperations(user, Actions.Update);

        return user.toResponse();
    }

    async validateInviteToken(token: string): Promise<{ isValid: boolean; invite?: any; message: string }> {
        try {
            // First verify JWT token
            const decodedToken = verifyInviteToken(token);
            
            // Validate token type
            if (decodedToken.type !== 'invite') {
                return {
                    isValid: false,
                    message: 'Invalid token type'
                };
            }

            // Find invite by token
            const invite = await this.inviteRepository.firstOrDefault({
                where: { token: token, active: true, deleted: false }
            });
            
            if (!invite) {
                return {
                    isValid: false,
                    message: 'Invite not found'
                };
            }

            // Check if invite is still valid
            if (!invite.isValid()) {
                return {
                    isValid: false,
                    message: 'Invite is no longer valid'
                };
            }

            // Verify token data matches invite data
            if (decodedToken.email !== invite.email || 
                decodedToken.companyId !== invite.companyId ||
                decodedToken.role !== invite.role) {
                return {
                    isValid: false,
                    message: 'Token data mismatch'
                };
            }

            // Check if user already exists with this email
            const existingUser = await this.userRepository.firstOrDefault({
                where: { email: invite.email, companyId: invite.companyId, active: true, deleted: false }
            });

            if (existingUser) {
                return {
                    isValid: false,
                    message: 'User with this email already exists'
                };
            }

            return {
                isValid: true,
                invite: invite.toResponse(),
                message: 'Invite token is valid'
            };

        } catch (error) {
            console.error('Error validating invite token:', error);
            return {
                isValid: false,
                message: 'Invalid or expired invite token'
            };
        }
    }

    async signUpWithInvite(signUpRequest: IInviteSignUpRequest): Promise<IUserResponse & { token: string }> {
        // First validate the invite token with JWT verification
        const validation = await this.validateInviteToken(signUpRequest.inviteToken);
        
        if (!validation.isValid) {
            throw new AppError(validation.message, '400');
        }

        // Find invite by token (we know it's valid from validation above)
        const invite = await this.inviteRepository.firstOrDefault({
            where: { token: signUpRequest.inviteToken, active: true, deleted: false },
            relations: { company: true }
        });
        
        if (!invite) {
            throw new AppError('Invalid invite token', '400');
        }

        // Check if company is active
        if (!invite.company?.active) {
            throw new AppError('Your company is not active. Please contact your admin.', '403');
        }

        // Check if username already exists in the company
        const existingUserByUsername = await this.userRepository.firstOrDefault({
            where: { userName: signUpRequest.userName, companyId: invite.companyId, active: true, deleted: false }
        });

        if (existingUserByUsername) {
            throw new AppError('Username already exists in this company', '400');
        }

        // Get the actual Role entity based on the InviteRole enum
        const role = await this.roleRepository.firstOrDefault({
            where: { 
                code: invite.role, // InviteRole enum maps to role code
                companyId: invite.companyId, 
                active: true, 
                deleted: false 
            }
        });

        if (!role) {
            throw new AppError(`Role '${invite.role}' not found for this company`, "404");
        }

        let newUser = new User().toEntity(
            {
                userName: signUpRequest.userName,
                email: invite.email,
                firstName: signUpRequest.firstName,
                middleName: signUpRequest.middleName,
                lastName: signUpRequest.lastName,
                dateOfBirth: signUpRequest.dateOfBirth ? new Date(signUpRequest.dateOfBirth) : undefined,
                pictureUrl: signUpRequest.pictureUrl,
                phoneNumber: signUpRequest.phoneNumber,
                roleId: role.id,
                isGoogleSignup: false,
                isEmailVerified: true, // Email is pre-verified through invite
            },
            undefined,
            { name: "Invite Signup", id: EmptyGuid, companyId: invite.companyId, roleId: "", role: "", privileges: [] }
        );

        if (signUpRequest.password)
            newUser.passwordHash = await encrypt(signUpRequest.password);

        // Save the user
        const savedUser = await this.userRepository.invokeDbOperations(newUser, Actions.Add);

        // Extract salary, benefits, and departmentId from invite token if role is EMPLOYEE
        let tokenSalary: number | undefined;
        let tokenBenefits: any[] | undefined;
        let tokenDepartmentId: string | undefined;

        if (invite.role === InviteRole.EMPLOYEE) {
            try {
                const decodedToken = verifyInviteToken(signUpRequest.inviteToken);
                tokenSalary = decodedToken.salary;
                tokenBenefits = decodedToken.benefits;
                tokenDepartmentId = decodedToken.departmentId;
                console.log('Extracted values - Salary:', tokenSalary, 'Benefits:', tokenBenefits, 'DepartmentId:', tokenDepartmentId);
            } catch (error) {
                console.warn('Could not extract salary/benefits/departmentId from invite token:', error);
            }
        }

        // Create employee record if role is EMPLOYEE
        if (invite.role === InviteRole.EMPLOYEE) {
            if (!tokenDepartmentId) {
                throw new AppError('Department ID is required in invite token', '400');
            }
            if (!signUpRequest.designationId) {
                throw new AppError('Designation ID is required', '400');
            }
            if (!signUpRequest.joiningDate) {
                throw new AppError('Joining date is required', '400');
            }

            // Auto-generate employee code via the shared, collision-safe generator
            const autoEmployeeCode = await generateEmployeeCode(this.employeeRepository, invite.companyId);

            // Create employee record
            const employee = new Employee().toEntity(
                {
                    userId: savedUser.id,
                    employeeCode: autoEmployeeCode,
                    departmentId: tokenDepartmentId,
                    designationId: signUpRequest.designationId,
                    joiningDate: signUpRequest.joiningDate,
                    salary: tokenSalary,
                    status: signUpRequest.status,
                    probationEndDate: signUpRequest.probationEndDate,
                    phoneNumber: signUpRequest.phoneNumber,
                    emergencyContact: signUpRequest.emergencyContact,
                    shiftId: signUpRequest.shiftId,
                    bankName: signUpRequest.bankName,
                    accountNumber: signUpRequest.accountNumber,
                    ibanNumber: signUpRequest.ibanNumber,
                    address: signUpRequest.address,
                    user: savedUser
                },
                undefined,
                { name: "Invite Signup", id: EmptyGuid, companyId: invite.companyId, roleId: "", role: "", privileges: [] }
            );

            const savedEmployee = await this.employeeRepository.invokeDbOperations(employee, Actions.Add);

            // Create employee benefits if provided
            if (tokenBenefits && tokenBenefits.length > 0) {
                for (const benefitData of tokenBenefits) {
                    const employeeBenefit = new EmployeeBenefit().toEntity(
                        {
                            userId: savedUser.id,
                            employeeId: savedEmployee.id,
                            benefitId: benefitData.benefitId,
                            effectiveDate: benefitData.effectiveDate ? new Date(benefitData.effectiveDate) : new Date(),
                            endDate: benefitData.endDate ? new Date(benefitData.endDate) : undefined,
                            customValue: benefitData.customValue,
                            notes: benefitData.notes
                        },
                        undefined,
                        { name: "Invite Signup", id: EmptyGuid, companyId: invite.companyId, roleId: "", role: "", privileges: [] }
                    );

                    await this.employeeBenefitRepository.invokeDbOperations(employeeBenefit, Actions.Add);
                }
            }
        }

        // Mark invite as accepted
        invite.markAsAccepted();
        await this.inviteRepository.invokeDbOperations(invite, Actions.Update);

        // Generate JWT token
        const token = signJwt({
            id: savedUser.id,
            name: `${savedUser.firstName} ${savedUser.lastName}`,
            companyId: savedUser.companyId,
            roleId: savedUser.roleId,
            role: role.code, // Use the actual role code
            privileges: [] // Will be populated when privileges are loaded
        });

        // Get full user data with relations
        const userWithRelations = await this.userRepository.getOneByQuery({
            filters: [{ field: 'id', value: savedUser.id, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }],
            relations: { company: true, role: true, employee: true }
        });

        return {
            ...userWithRelations!.toResponse(),
            token
        };
    }

    async getCurrentProfile(userId: string): Promise<IUserResponse> {
        if (!userId) throw new AppError('User ID is required', '400');

        const userEntity = await this.userRepository.getOneByQuery({
            filters: [{ field: 'id', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }],
            relations: { 
                company: true, 
                role: true, 
                employee: {
                    department: true,
                    designation: true,
                    shift: true,
                    benefits: {
                        benefit: true
                    }
                }
                
            }
        });

        if (!userEntity) throw new AppError('User not found', '404');

        // Check if company is active
        if (!userEntity.company?.active) {
            throw new AppError('Your company is not active. Please contact your admin.', '403');
        }

        // Check if user is active
        if (!userEntity.active) {
            throw new AppError('Your account is inactive. Please contact your admin.', '403');
        }

        return userEntity.toResponse();
    }

    private createCompanyFromRequest(request: ISignUpRequest): Company {
        const company = new Company().toEntity(
            {
                name: request.userName,
                phoneNo: request.phoneNumber ?? "",
                email: request.email,
                address: request.address,
                temporaryAddress: request.temporaryAddress,
                zipCode: request.zipCode,
                country: request.country,
                state: request.state,
                city: request.city,
            },
            undefined,
            { name: "System Signup", id: EmptyGuid, companyId: "", roleId: "", role: "", privileges: [] }
        );
        company.id = randomUUID();
        return company;
    }

    private createCompanyAdminRole(companyId: string, company: Company, privilegeIds: string[]): Role {
        const role = new Role().toEntity(
            { name: "Company Admin", code: DefaultRoles.Admin, privilegeIds },
            undefined,
            { name: "System Signup", id: EmptyGuid, companyId: "", roleId: "", role: "", privileges: [] }
        );
        role.id = randomUUID();
        role.companyId = companyId;
        role.company = company;
        return role;
    }

    private async createUserFromRequest(request: ISignUpRequest, company: Company, role: Role): Promise<User> {
        const user = new User().toEntity(
            {
                userName: request.userName,
                email: request.email,
                firstName: request.firstName,
                middleName: request.middleName,
                lastName: request.lastName,
                dateOfBirth: request.dateOfBirth,
                gender: request.gender,
                pictureUrl: request.pictureUrl,
                roleId: role.id,
                isGoogleSignup: false,
            },
            undefined,
            { name: "System Signup", id: EmptyGuid, companyId: EmptyGuid, roleId: "", role: "", privileges: [] }
        );

        user.role = role;
        user.company = company;
        user.roleId = role.id;
        user.companyId = company.id;

        if (request.password) {
            user.passwordHash = await encrypt(request.password);
        }

        return user;
    }

    private  createVerificationRecord(user: User, whichPurpose: string): { verification: Verification, code: string } {
        // Generate random 6-digit code
        const otpCode = randomInt(100000, 999999).toString();
        
        // Create verification entity
        const verification = new Verification().toEntity(
            {
                userId: user.id,
                target: user.email,
                type: "email",
                code: otpCode,
                whichPurpose: whichPurpose,
                isVerified: false,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Set expiration time to 10 minutes from now
            },
            undefined,
            { name: "System Signup", id: EmptyGuid, companyId: "", roleId: "", role: "", privileges: [] }
        );
        verification.id = randomUUID();

        return { verification, code: otpCode };
    }

    private async createNewUserCompany(userRequest: ISignUpRequest, isGoogle: boolean = false): Promise<User>{
        try{
            let company: Company = new Company().toEntity(
              {
                name: userRequest.userName,
                phoneNo: userRequest.phoneNumber ?? "",
                email: userRequest.email,
                address: userRequest.address,
                temporaryAddress: userRequest.temporaryAddress,
                zipCode: userRequest.zipCode,
                country: userRequest.country,
                state: userRequest.state,
                city: userRequest.city,
              },
              undefined,
              { name: "system", id: EmptyGuid, companyId: "", roleId: "", role: "", privileges: [] }
            );
            company.id = randomUUID();
            let role: Role = new Role().toEntity(
              { name: "Company Admin", code: DefaultRoles.Admin, privilegeIds: [] },
              undefined,
              { name: "system", id: EmptyGuid, companyId: "", roleId: "", role: "", privileges: [] }
            );
    
            role.id = randomUUID();
            role.privileges = [];
            role.companyId = undefined;
            role.company = undefined;
    
            await this.companyRepository.invokeDbOperations(company, Actions.Add);
            await this.roleRepository.invokeDbOperations(role, Actions.Add);
    
            let user: User = new User().toEntity(
              {
                userName: userRequest.userName,
                email: userRequest.email,
                firstName: userRequest.firstName,
                middleName: userRequest.middleName,
                lastName: userRequest.lastName,
                dateOfBirth: userRequest.dateOfBirth,
                gender: userRequest.gender,
                pictureUrl: userRequest.pictureUrl,
                roleId: role.id,
                isGoogleSignup: false,
              },
              undefined,
              { name: "Admin", id: EmptyGuid, companyId: EmptyGuid, roleId: "", role: "", privileges: [] }
            );
    
            user.role = role;
            user.company = company;
            user.roleId = role.id;
            user.companyId = company.id;
    
            if (userRequest.password)
              user.passwordHash = await encrypt(userRequest.password);
            return user;
        }catch(err){
            throw err;
        }
    }
}
