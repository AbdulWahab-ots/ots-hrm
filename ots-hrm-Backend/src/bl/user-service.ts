import { inject, injectable } from "tsyringe";
import { UserRepository, RoleRepository, CompanyRepository } from "../dal";
import { FilterMatchModes, FilterOperators, IUserRequest, IUserResponse, ICreateUserRequest, IBulkCreateUsersRequest, ITokenUser, Actions, Gender, ICreateUserRequestBody, IBulkUserResponse } from "../models";
import { User } from "../entities";
import { Service } from "./generics/service";
import { AppError } from '../utility/app-error';
import { encrypt, compareHash } from '../utility/bcrypt-utility';
import { DefaultRoles } from '../constants/roles';
import { ILike } from "typeorm";

@injectable()
export class UserService extends Service<User, IUserResponse, IUserRequest> {

    constructor(
        @inject('UserRepository') private readonly userRepository: UserRepository,
        @inject('RoleRepository') private readonly roleRepository: RoleRepository,
        @inject('CompanyRepository') private readonly companyRepository: CompanyRepository,
    ) {
        super(userRepository, () => new User)
    }
    
    async existsByEmail(email: string): Promise<boolean> {
        return await this.userRepository.existsByEmail(email);
    }

    async existsByUsername(username: string): Promise<boolean> {
        return await this.userRepository.existsByUsername(username);
    }
    
    async getById(id: string, contextUser?: ITokenUser): Promise<IUserResponse> {
        if (!id) throw new AppError('User ID is required', '400');

        // Scope the lookup to the caller's company so one tenant can't read another's users.
        // A super admin acting on a company carries that company as contextUser.companyId
        // (set in validateCompanyHeader), so they read within the selected company.
        const companyId = contextUser?.companyId;

        const userEntity = await this.userRepository.getOneByQuery({
            filters: [{ field: 'id', value: id, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }],
            relations: { company: true, role: true, employee: true }
        }, false, true, companyId);

        if (!userEntity) throw new AppError('User not found', '404');

        return userEntity.toResponse();
    }

    async createUsers(request: ICreateUserRequestBody, contextUser: ITokenUser): Promise<IUserResponse | IBulkUserResponse> {
        // Check if it's a bulk request (has 'users' property)
        if ('users' in request) {
            return await this.createMultipleUsers(request, contextUser);
        } else {
            // Single user
            return await this.createUser(request, contextUser);
        }
    }

    async createUser(userRequest: ICreateUserRequest, contextUser: ITokenUser): Promise<IUserResponse> {
        // Check if user with same username or email already exists
        const existingUser = await this.userRepository.firstOrDefault({
            where: [{userName: userRequest.userName}, { email: ILike(userRequest.email) }],
        });

        if (existingUser) {
            throw new AppError('User with this username or email already exists', '409');
        }

        // Determine company ID based on user role
        let companyId: string;
        if (contextUser.role === DefaultRoles.SuperAdmin) {
            // Super admin must provide company ID
            if (!userRequest.companyId) {
                throw new AppError('Company ID is required for super admin', '400');
            }
            companyId = userRequest.companyId;
        } else if (contextUser.role === DefaultRoles.Admin) {
            // Admin uses company ID from token
            companyId = contextUser.companyId;
        } else {
            throw new AppError('Insufficient permissions to create users', '403');
        }

        // The internal system/super-admin company can only ever contain the super admin
        const targetCompany = await this.companyRepository['repository'].findOne({ where: { id: companyId } });
        if (targetCompany?.isSystemCompany) {
            throw new AppError('Cannot add users to the system company', '400');
        }

        // Fetch role by name and company
        const roleEntity = await this.roleRepository.firstOrDefault({
            where: {
                code: userRequest.role || DefaultRoles.Admin, // Use role name or ID
                companyId: companyId
            }
        });

        if (!roleEntity) {
            throw new AppError(`Role '${userRequest.role}' not found for this company`, '400');
        }

        // Create user entity
        const userEntity = new User().toEntity(
            {
                userName: userRequest.userName,
                email: userRequest.email,
                firstName: userRequest.firstName,
                lastName: userRequest.lastName,
                middleName: userRequest.middleName,
                roleId: roleEntity.id, // Use the fetched role ID
                isEmailVerified: true,
                isGoogleSignup: false,
                companyId: companyId,
            },
            undefined, // No ID for new user
            {...contextUser}
        );

        if (userRequest.password) {
            userEntity.passwordHash = await encrypt(userRequest.password);
        }

        return await this.repository.invokeDbOperationsWithResponse(userEntity, Actions.Add);
    }

    async createMultipleUsers(bulkRequest: IBulkCreateUsersRequest, contextUser: ITokenUser): Promise<IBulkUserResponse> {
        if (!bulkRequest.users || bulkRequest.users.length === 0) {
            throw new AppError('Users array is required and cannot be empty', '400');
        }

        // Validate permissions
        if (contextUser.role !== DefaultRoles.SuperAdmin && contextUser.role !== DefaultRoles.Admin) {
            throw new AppError('Insufficient permissions to create users', '403');
        }

        const successful: IUserResponse[] = [];
        const failed: Array<{userName: string; email: string; error: string}> = [];

        for (let i = 0; i < bulkRequest.users.length; i++) {
            const userRequest = bulkRequest.users[i];
            try {
                const result = await this.createUser(userRequest, contextUser);
                successful.push(result);
            } catch (error) {
                const errorMessage = error instanceof AppError ? error.message : 'Unknown error';
                failed.push({
                    userName: userRequest.userName,
                    email: userRequest.email,
                    error: errorMessage
                });
            }
        }

        return {
            successful,
            failed,
            totalProcessed: bulkRequest.users.length,
            successCount: successful.length,
            failureCount: failed.length
        };
    }

    // Toggle a single user's active flag (e.g. from the super admin / company admin user table).
    // No cascade — unlike CompanyService.toggleCompanyActive this only affects the one user.
    // Login is already blocked for inactive users in AuthService.login / loginWithGoogle.
    async toggleUserActive(userId: string, isActive: boolean, contextUser: ITokenUser): Promise<IUserResponse> {
        // Scope the lookup to the caller's company so one tenant can't toggle another's users,
        // and so a missing user returns a clean 404 instead of partialUpdate's generic error.
        const user = await this.userRepository.getOneByQuery({
            filters: [{ field: 'id', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }],
            relations: { role: true }
        }, false, true, contextUser.companyId);

        if (!user) throw new AppError('User not found', '404');

        // Don't let the company's last active admin be deactivated, or no one could administer it.
        // The frontend warns about this too, but a direct API call would otherwise bypass that.
        if (!isActive && user.active && user.role?.code === DefaultRoles.Admin) {
            const activeAdmins = await this.userRepository.queryBuilder('user')
                .innerJoin('user.role', 'role')
                .where('user.companyId = :companyId', { companyId: user.companyId })
                .andWhere('user.deleted = false')
                .andWhere('user.active = true')
                .andWhere('role.code = :roleCode', { roleCode: DefaultRoles.Admin })
                .getCount();

            if (activeAdmins <= 1) {
                throw new AppError('Cannot deactivate the last active admin for this company.', '409');
            }
        }

        const updated = await this.userRepository.partialUpdate(userId, { active: isActive } as any, contextUser);
        return updated.toResponse(updated);
    }

    async changePassword(currentPassword: string, newPassword: string, contextUser: ITokenUser): Promise<IUserResponse> {

        // Get the current user with password hash
        const user = await this.userRepository.firstOrDefault({
            where: { id: contextUser.id },
            relations: { company: true, role: true, employee: true }
        });

        if (!user) {
            throw new AppError('User not found', '404');
        }

        // Check if user has a password (not Google signup)
        if (!user.passwordHash) {
            throw new AppError('Password change not allowed for Google signup users', '400');
        }

        // Verify current password
        const isCurrentPasswordValid = await compareHash(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new AppError('Current password is incorrect', '400');
        }

        // Check if new password is different from current password
        const isNewPasswordSame = await compareHash(newPassword, user.passwordHash);
        if (isNewPasswordSame) {
            throw new AppError('New password must be different from current password', '400');
        }

        // Encrypt and update password
        user.passwordHash = await encrypt(newPassword);

        // Update user in database
        const updatedUser = await this.userRepository.invokeDbOperationsWithResponse(user, Actions.Update);

        return updatedUser;
    }
}
