import { inject, injectable } from "tsyringe";
import { In, MoreThanOrEqual } from "typeorm";
import { PrivilegeService, InviteService } from "../bl";
import { CompanyRepository, RoleRepository, UserRepository, DepartmentRepository, DesignationRepository, ShiftRepository, LeaveTypeRepository, BenefitRepository, EmployeeRepository, InviteRepository } from "../dal";
import { Actions, Gender, ICompanyRequest, ICompanyResponse, ITokenUser, IUserRequest, IFetchRequest, IDataSourceResponse, IGetSingleRecordFilter, IFilter, RelationLoad, IInviteCreateRequest, InviteRole, InviteStatus } from "../models";
import { Company, Role, User } from "../entities";
import { randomUUID } from "crypto";
import { EmptyGuid, DefaultRoles, DefaultRoleDetails } from "../constants";
import { Service } from "./generics/service";
import { encrypt } from "../utility";
import { AppError } from "../utility/app-error";

@injectable()
export class CompanyService extends Service<Company, ICompanyResponse, ICompanyRequest> {
    constructor(
        @inject('UserRepository') private readonly userRepository: UserRepository,
        @inject('CompanyRepository') private readonly companyRepository: CompanyRepository,
        @inject('RoleRepository') private readonly roleRepository: RoleRepository,
        @inject('PrivilegeRepository') private readonly privilegeService: PrivilegeService,
        @inject('InviteService') private readonly inviteService: InviteService,
        @inject('DepartmentRepository') private readonly departmentRepository: DepartmentRepository,
        @inject('DesignationRepository') private readonly designationRepository: DesignationRepository,
        @inject('ShiftRepository') private readonly shiftRepository: ShiftRepository,
        @inject('LeaveTypeRepository') private readonly leaveTypeRepository: LeaveTypeRepository,
        @inject('BenefitRepository') private readonly benefitRepository: BenefitRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
        @inject('InviteRepository') private readonly inviteRepository: InviteRepository
    ){
        super(companyRepository, () => new Company)
    }

    // Override get method to allow super admin to fetch all companies
    async get(contextUser?: ITokenUser, fetchRequest?: IFetchRequest<ICompanyRequest> | undefined): Promise<IDataSourceResponse<ICompanyResponse>> {
        // If user is super admin, don't apply company filtering
        const companyId = contextUser?.role === DefaultRoles.SuperAdmin ? undefined : contextUser?.companyId;
        return await this.repository.getPagedData(fetchRequest ? fetchRequest as any as IFetchRequest<Company> : {}, false, true, companyId);
    }

    // Override getOne method to allow super admin to fetch any company
    async getOne(contextUser: ITokenUser, filtersRequest: IGetSingleRecordFilter<ICompanyRequest>): Promise<ICompanyResponse | null> {
        // If user is super admin, don't apply company filtering
        const companyId = contextUser.role === DefaultRoles.SuperAdmin ? undefined : contextUser.companyId;
        return await this.repository.getOneByQueryWithResponse({filters: filtersRequest.filters as Array<any> as Array<IFilter<Company, keyof Company>>, relations: filtersRequest.relations as RelationLoad<Company> | undefined }, false, false, companyId);
    }

    // Override getById method to allow super admin to fetch any company
    async getById(id: string, contextUser?: ITokenUser): Promise<ICompanyResponse | null> {
        // If user is super admin, don't apply company filtering
        const companyId = contextUser?.role === DefaultRoles.SuperAdmin ? undefined : contextUser?.companyId;
        return await this.repository.findOneByIdWithResponseAndCompanyVerification(id, companyId);
    }

    async existsByName(name: string): Promise<boolean> {
        return await this.companyRepository.existsByName(name);
    }

    // Override delete to protect the internal system/super-admin company from deletion
    async delete(id: string, contextUser: ITokenUser): Promise<void> {
        const company = await this.companyRepository['repository'].findOne({ where: { id } });
        if (company?.isSystemCompany) {
            throw new AppError("System company cannot be deleted", "400");
        }
        await super.delete(id, contextUser);
    }

    // Override deleteMany to protect the internal system/super-admin company from deletion
    async deleteMany(ids: Array<string>, contextUser: ITokenUser): Promise<void> {
        const companies = await this.companyRepository['repository'].find({ where: { id: In(ids) } });
        const systemCompanyIds = companies.filter(c => c.isSystemCompany).map(c => c.id);
        if (systemCompanyIds.length > 0) {
            throw new AppError("System company cannot be deleted", "400");
        }
        await super.deleteMany(ids, contextUser);
    }

    async addNewCompany(companyRequest: ICompanyRequest, contextUser?: ITokenUser): Promise<ICompanyResponse> {
        try {
            // Validate that at least one of defaultUser or invites is present
            if ((!companyRequest.defaultUser || companyRequest.defaultUser.length === 0) && 
                (!companyRequest.invites || companyRequest.invites.length === 0)) {
                throw new AppError("At least one of defaultUser or invites must be provided", "400");
            }

            // Create company
            const company = this.createCompanyFromRequest(companyRequest, contextUser);
            await this.companyRepository.invokeDbOperations(company, Actions.Add);
            
            // Create default roles for the company
            const { adminRole, employeeRole } = await this.createDefaultRoles(company, contextUser);

            // Create default users if provided
            if (companyRequest.defaultUser && companyRequest.defaultUser.length > 0) {
                for (const defaultUserRequest of companyRequest.defaultUser) {
                    const defaultUser = await this.createUserFromRequest(defaultUserRequest, company, adminRole, contextUser);
                    await this.userRepository.invokeDbOperations(defaultUser, Actions.Add);
                }
            }
            
            // Create invites if provided
            if (companyRequest.invites && companyRequest.invites.length > 0) {
                for (const inviteRequest of companyRequest.invites) {
                    // Set the companyId and default role for each invite
                    const inviteWithCompanyId: IInviteCreateRequest = {
                        ...inviteRequest,
                        companyId: company.id,
                        role: inviteRequest.role || InviteRole.ADMIN    
                    };
                    // Create a context user with the new company ID for invite creation
                    const inviteContextUser = contextUser ? {
                        ...contextUser,
                        companyId: company.id
                    } : {
                        id: EmptyGuid,
                        name: "System",
                        companyId: company.id,
                        roleId: "",
                        role: "system",
                        privileges: []
                    };
                    await this.inviteService.add(inviteWithCompanyId, inviteContextUser);
                }
            }
            
            // Prepare response and token
            const companyResponse = company.toResponse();
            
            return {
                ...companyResponse
            }

        } catch (error) {
            throw error;
        }
    }

    private createCompanyFromRequest(request: ICompanyRequest, contextUser?: ITokenUser): Company {
        const company = new Company().toEntity(
            {
                name: request.name,
                phoneNo: request.phoneNo ?? "",
                email: request.email,
                address: request.address,
                temporaryAddress: request.temporaryAddress,
                zipCode: request.zipCode,
                country: request.country,
                state: request.state,
                city: request.city,
            },
            undefined,
            { 
                name: contextUser?.name ?? "system", 
                id: contextUser?.id ?? EmptyGuid, 
                companyId: contextUser?.companyId ?? "", 
                roleId: contextUser?.roleId ?? "",
                role: contextUser?.role ?? "",
                employeeId: contextUser?.employeeId,
                privileges: contextUser?.privileges ?? [] 
            }
        );
        company.id = randomUUID();
        return company;
    }

    private async createDefaultRoles(company: Company, contextUser?: ITokenUser): Promise<{ adminRole: Role, employeeRole: Role }> {
        // Create Admin role using DefaultRoleDetails
        const adminRoleDetails = DefaultRoleDetails[DefaultRoles.Admin];
        const adminRole = this.createRole(
            { 
                name: adminRoleDetails.name, 
                code: adminRoleDetails.code, 
                privilegeIds: [] 
            },
            company,
            contextUser
        );
        await this.roleRepository.invokeDbOperations(adminRole, Actions.Add);

        // Create Employee role using DefaultRoleDetails
        const employeeRoleDetails = DefaultRoleDetails[DefaultRoles.Employee];
        const employeeRole = this.createRole(
            { 
                name: employeeRoleDetails.name, 
                code: employeeRoleDetails.code, 
                privilegeIds: [] 
            },
            company,
            contextUser
        );
        await this.roleRepository.invokeDbOperations(employeeRole, Actions.Add);

        return { adminRole, employeeRole };
    }

    private createRole(roleData: { name: string, code: string, privilegeIds: string[] }, company: Company, contextUser?: ITokenUser): Role {
        const role = new Role().toEntity(
            roleData,
            undefined,
            { 
                name: contextUser?.name ?? "system", 
                id: contextUser?.id ?? EmptyGuid, 
                companyId: contextUser?.companyId ?? "", 
                roleId: contextUser?.roleId ?? "",
                role: contextUser?.role ?? "",
                employeeId: contextUser?.employeeId,
                privileges: contextUser?.privileges ?? [] 
            }
        );
        role.id = randomUUID();
        role.privileges = [];
        role.companyId = company.id;
        role.company = company;
        return role;
    }

    private async createUserFromRequest(userRequest: any, company: Company, role: Role, contextUser?: ITokenUser): Promise<User> {
        let userData: IUserRequest = {
            userName: userRequest.username ?? "",
            email: userRequest.email ?? "",
            password: userRequest.password,
            firstName: userRequest.firstName ?? "",
            middleName: userRequest.middleName,
            lastName: userRequest.lastName ?? "",
            dateOfBirth: userRequest.dateOfBirth,
            gender: userRequest.gender ?? Gender.Unknown,
            pictureUrl: userRequest.pictureUrl ?? "",
            roleId: "",
            isGoogleSignup: false
        };
        const user = new User().toEntity(
            {
                ...userData,
                isGoogleSignup: false,
            },
            undefined,
            { 
                name: contextUser?.name ?? "system", 
                id: contextUser?.id ?? EmptyGuid, 
                companyId: contextUser?.companyId ?? "", 
                roleId: contextUser?.roleId ?? "",
                role: contextUser?.role ?? "",
                employeeId: contextUser?.employeeId ?? "",
                privileges: contextUser?.privileges ?? [] 
            }
        );

        user.role = role;
        user.company = company;
        user.roleId = role.id;
        user.companyId = company.id;
        user.isEmailVerified = true;

        if (userData.password) {
            user.passwordHash = await encrypt(userData.password);
        }

        return user;
    }

    async toggleCompanyActive(companyId: string, isActive: boolean, contextUser: ITokenUser): Promise<ICompanyResponse> {
        // Update company active status
        const updated = await this.companyRepository.partialUpdate(
            companyId,
            { active: isActive } as any,
            contextUser
        );

        // Cascade: update all non-deleted users in this company
        await this.userRepository['repository'].update(
            { companyId, deleted: false },
            { active: isActive }
        );

        return updated.toResponse(updated);
    }

    async getSuperAdminDashboardStats(): Promise<{
        totals: { totalCompanies: number; activeCompanies: number; inactiveCompanies: number };
        periods: {
            daily:   { total: number; active: number; inactive: number };
            weekly:  { total: number; active: number; inactive: number };
            monthly: { total: number; active: number; inactive: number };
            yearly:  { total: number; active: number; inactive: number };
        };
        timeline: { yearly: number[]; monthly: number[] };
        recentCompanies: { name: string; createdAt: Date; active: boolean }[];
    }> {
        const repo = this.companyRepository['repository'];
        const now = new Date();

        const startOf = (unit: 'day' | 'week' | 'month' | 'year'): Date => {
            const d = new Date(now);
            if (unit === 'day')   { d.setHours(0, 0, 0, 0); }
            if (unit === 'week')  { const day = d.getDay(); d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0); }
            if (unit === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); }
            if (unit === 'year')  { d.setMonth(0, 1); d.setHours(0, 0, 0, 0); }
            return d;
        };

        // The internal system/super-admin company should never be counted in dashboard stats
        const periodCount = async (from: Date) => {
            const [total, active] = await Promise.all([
                repo.count({ where: { deleted: false, isSystemCompany: false, createdAt: MoreThanOrEqual(from) } }),
                repo.count({ where: { deleted: false, isSystemCompany: false, active: true, createdAt: MoreThanOrEqual(from) } }),
            ]);
            return { total, active, inactive: total - active };
        };

        const [totals, daily, weekly, monthly, yearly] = await Promise.all([
            (async () => {
                const [total, active] = await Promise.all([
                    repo.count({ where: { deleted: false, isSystemCompany: false } }),
                    repo.count({ where: { deleted: false, isSystemCompany: false, active: true } }),
                ]);
                return { totalCompanies: total, activeCompanies: active, inactiveCompanies: total - active };
            })(),
            periodCount(startOf('day')),
            periodCount(startOf('week')),
            periodCount(startOf('month')),
            periodCount(startOf('year')),
        ]);

        // Timeline: companies created per month in current year (index 0 = Jan)
        const yearStart = startOf('year');
        const yearlyTimeline = await repo
            .createQueryBuilder('c')
            .select('EXTRACT(MONTH FROM c."createdAt")::int', 'month')
            .addSelect('COUNT(*)', 'count')
            .where('c.deleted = false')
            .andWhere('c."isSystemCompany" = false')
            .andWhere('c."createdAt" >= :yearStart', { yearStart })
            .groupBy('month')
            .orderBy('month', 'ASC')
            .getRawMany<{ month: number; count: string }>();

        const yearlyArr = Array(12).fill(0);
        yearlyTimeline.forEach(r => { yearlyArr[r.month - 1] = parseInt(r.count, 10); });

        // Timeline: companies created per day in current month
        const monthStart = startOf('month');
        const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthlyTimeline = await repo
            .createQueryBuilder('c')
            .select('EXTRACT(DAY FROM c."createdAt")::int', 'day')
            .addSelect('COUNT(*)', 'count')
            .where('c.deleted = false')
            .andWhere('c."isSystemCompany" = false')
            .andWhere('c."createdAt" >= :monthStart', { monthStart })
            .groupBy('day')
            .orderBy('day', 'ASC')
            .getRawMany<{ day: number; count: string }>();

        const monthlyArr = Array(daysInCurrentMonth).fill(0);
        monthlyTimeline.forEach(r => { monthlyArr[r.day - 1] = parseInt(r.count, 10); });

        // Recent 5 companies
        const recentRaw = await repo.find({
            where: { deleted: false, isSystemCompany: false },
            order: { createdAt: 'DESC' } as any,
            take: 5,
            select: ['name', 'createdAt', 'active'] as any,
        });
        const recentCompanies = recentRaw.map((c: any) => ({ name: c.name, createdAt: c.createdAt, active: c.active }));

        return { totals, periods: { daily, weekly, monthly, yearly }, timeline: { yearly: yearlyArr, monthly: monthlyArr }, recentCompanies };
    }

    async getCompanyStatistics(companyId: string): Promise<{
        departments: number;
        designations: number;
        shifts: number;
        leaveTypes: number;
        benefits: number;
        activeAdminUsers: number;
        pendingInvites: number;
        activeEmployees: number;
    }> {
        try {

            let whereConditions = { companyId, deleted: false, active: true };

            // Get counts for all entities for the specified company
            const [departments, designations, shifts, leaveTypes, benefits, activeAdminUsers, pendingInvites, activeEmployees] = await Promise.all([
                this.departmentRepository.entityCount({ ...whereConditions }),
                this.designationRepository.entityCount({ ...whereConditions }),
                this.shiftRepository.entityCount({ ...whereConditions }),
                this.leaveTypeRepository.entityCount({ ...whereConditions }),
                this.benefitRepository.entityCount({ ...whereConditions }),
                this.countActiveAdminUsers(companyId),
                this.inviteRepository.entityCount({ companyId, deleted: false, active: true, status: InviteStatus.PENDING } as any),
                this.employeeRepository.entityCount({ ...whereConditions })
            ]);

            return {
                departments,
                designations,
                shifts,
                leaveTypes,
                benefits,
                activeAdminUsers,
                pendingInvites,
                activeEmployees
            };
        } catch (error) {
            throw new AppError(
                `Failed to fetch company statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
                '500'
            );
        }
    }

    // Roles are per-company rows (each company gets its own Admin/Employee role created in
    // createDefaultRoles), so "admin users" can't be matched by a constant roleId — join on role.code.
    private async countActiveAdminUsers(companyId: string): Promise<number> {
        return await this.userRepository['repository']
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .where('user.companyId = :companyId', { companyId })
            .andWhere('user.deleted = false')
            .andWhere('user.active = true')
            .andWhere('role.code = :roleCode', { roleCode: DefaultRoles.Admin })
            .getCount();
    }
}