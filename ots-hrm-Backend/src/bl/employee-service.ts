import { inject, injectable } from "tsyringe";
import { EmployeeRepository, RoleRepository, UserRepository } from "../dal";
import { Employee, Role, User, EmployeeBenefit } from "../entities";
import { Actions, IEmployeeRequest, IEmployeeResponse, IEmployeeSetupWarning, IEmployeeStatsResponse, ITokenUser } from "../models";
import { Service } from "./generics/service";
import { encrypt } from "../utility";
import { Not } from "typeorm";
import { AppError } from "../utility/app-error";
import { UserShiftService } from "./user-shift-service";
import { EmployeeBenefitService } from "./employee-benefit-service";
import { generateEmployeeCode } from "../utility/employee-code";

@injectable()
export class EmployeeService extends Service<Employee, IEmployeeResponse, IEmployeeRequest> {
    constructor(
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
        @inject('UserRepository') private readonly userRepository: UserRepository,
        @inject('RoleRepository') private readonly roleRepository: RoleRepository,
        @inject('UserShiftService') private readonly userShiftService: UserShiftService,
        @inject('EmployeeBenefitService') private readonly employeeBenefitService: EmployeeBenefitService
    ) {
        super(employeeRepository, () => new Employee())
    }


    // The profile / details page needs the related records, so load them here.
    // (The generic getById returns only the flat employee row.)
    async getById(id: string, contextUser?: ITokenUser): Promise<IEmployeeResponse | null> {
        const employee = await this.employeeRepository.firstOrDefault({
            where: { id, ...(contextUser?.companyId ? { companyId: contextUser.companyId } : {}) } as any,
            relations: {
                user: true,
                department: true,
                designation: true,
                shift: true,
                benefits: { benefit: true },
            },
        });
        return employee ? employee.toResponse() : null;
    }

    public async add(entityRequest: IEmployeeRequest, contextUser: ITokenUser): Promise<IEmployeeResponse> {
        let { user: userRequest, shiftId, benefits, ...employeeRequest } = entityRequest;

        if (!userRequest.password) {
            throw new AppError("Password is required for creating a user.", "400");
        }

        if (!employeeRequest.employeeCode) {
            employeeRequest.employeeCode = await generateEmployeeCode(this.employeeRepository, contextUser.companyId);
        }

        // Ensure the company's employee role exists. Roles are company-scoped, so the lookup
        // must be scoped too — otherwise another tenant's 'employee' role could be picked up.
        // This is created up front, not as part of the per-employee transaction.
        let employeeRole = await this.roleRepository.firstOrDefault({
            where: { code: 'employee', companyId: contextUser.companyId }
        });
        if (!employeeRole) {
            const role = new Role().toEntity(
                { name: "Employee", code: "employee", privilegeIds: [] },
                undefined,
                contextUser
            );
            employeeRole = await this.roleRepository.invokeDbOperations(role, Actions.Add);
        }

        // Build the user + employee entities
        let user = new User().toEntity(
            {
                ...userRequest,
                roleId: employeeRole.id,
                isEmailVerified: true
            },
            undefined,
            contextUser
        );
        user.passwordHash = await encrypt(userRequest.password);

        let employee = new Employee().toEntity(
            {
                ...employeeRequest,
                userId: user.id,
                user: user,
                shiftId: shiftId ? shiftId : undefined
            },
            undefined,
            contextUser
        );
        if (employeeRequest.status) {
            employee.onStatusChange(employeeRequest.status);
        }

        // Core: the user account and the employee record are created atomically. Either both
        // exist or neither does.
        const queryRunner = await this.employeeRepository.beginTransaction();
        let employeeCreated: Employee;
        try {
            await this.userRepository.invokeDbOperations(user, Actions.Add, queryRunner);
            employeeCreated = await this.employeeRepository.invokeDbOperations(employee, Actions.Add, queryRunner);
            await this.employeeRepository.commitTransaction(queryRunner);
        } catch (error) {
            await this.employeeRepository.rollbackTransaction(queryRunner);
            throw error;
        }

        // Deferred: benefits and shift are best-effort add-ons. A failure here does not roll back
        // the created employee; it is surfaced as a warning so the admin can finish the step from
        // the profile screen.
        const warnings: IEmployeeSetupWarning[] = [];

        if (benefits && benefits.length > 0) {
            try {
                for (const benefitRequest of benefits) {
                    const employeeBenefit = new EmployeeBenefit().toEntity(
                        {
                            ...benefitRequest,
                            userId: user.id,
                            employeeId: employeeCreated.id
                        },
                        undefined,
                        contextUser
                    );
                    await this.employeeBenefitService.addBenefit(employeeBenefit);
                }
            } catch (benefitError) {
                const message = benefitError instanceof Error ? benefitError.message : 'Unknown error occurred';
                warnings.push({ step: 'benefits', message: `Failed to add employee benefits: ${message}` });
            }
        }

        if (shiftId) {
            try {
                await this.userShiftService.assignOrUpdateUserShift(
                    { userId: user.id, shiftId: shiftId },
                    contextUser
                );
            } catch (shiftError) {
                const message = shiftError instanceof Error ? shiftError.message : 'Unknown error occurred';
                warnings.push({ step: 'shift', message: `Failed to assign shift: ${message}` });
            }
        }

        // Return the employee with benefits loaded
        const employeeWithBenefits = await this.employeeRepository.firstOrDefault({
            where: { id: employeeCreated.id },
            relations: {
                user: true,
                department: true,
                designation: true,
                shift: true,
                benefits: {
                    benefit: true // Also load the benefit details
                }
            }
        });

        if (!employeeWithBenefits) {
            throw new AppError("Failed to retrieve created employee.", "500");
        }

        const response = employeeWithBenefits.toResponse();
        if (warnings.length > 0) {
            response.warnings = warnings;
        }
        return response;
    }

    public async update(id: string, entityRequest: IEmployeeRequest, contextUser: ITokenUser): Promise<IEmployeeResponse> {
        // Update is all-or-nothing: the user, employee, shift and benefit changes either all
        // commit together or none do.
        const queryRunner = await this.employeeRepository.beginTransaction();
        try {
            let { user: userRequest, shiftId, ...employeeRequest } = entityRequest;

            // Get the existing employee with user relation
            const existingEmployee = await this.employeeRepository.firstOrDefault({
                where: { id },
                relations: { user: true }
            });

            if (!existingEmployee) {
                throw new AppError("Employee not found.", "404");
            }

            // Uncomment if you want to enable validation
            await this.validateUpdateConstraints(id, userRequest, employeeRequest);

            // Update user data if provided
            if (userRequest && Object.keys(userRequest).length > 0) {
                const existingUser = existingEmployee.user;
                if (!existingUser) {
                    throw new AppError("Associated user not found.", "404");
                }

                let userUpdateData: Partial<any> = { ...userRequest };

                // Handle password update separately if provided
                if (userRequest.password) {
                    userUpdateData.passwordHash = await encrypt(userRequest.password);
                    delete userUpdateData.password;
                }

                await this.userRepository.partialUpdate(existingUser.id, userUpdateData, contextUser, queryRunner);
            }

            // Prepare employee update data - exclude benefits as they are handled separately
            const { benefits, ...employeeDataWithoutBenefits } = employeeRequest;
            let finalEmployeeUpdateData = { ...employeeDataWithoutBenefits, shiftId: shiftId ? shiftId : undefined } as Partial<Employee>;

            // Handle status change logic
            if (employeeRequest.status && employeeRequest.status !== existingEmployee.status) {
                // onStatusChange owns the rule: exit status sets active=false + departureDate
                // (supplied date or today); any active status reactivates and clears the date.
                existingEmployee.onStatusChange(employeeRequest.status, employeeRequest.departureDate);
                finalEmployeeUpdateData.status = employeeRequest.status;
                finalEmployeeUpdateData.active = existingEmployee.active;
                finalEmployeeUpdateData.departureDate = existingEmployee.departureDate;
            }

            // Update employee entity if there are employee-specific fields to update
            if (Object.keys(finalEmployeeUpdateData).length > 0) {
                await this.employeeRepository.partialUpdate(existingEmployee.id, finalEmployeeUpdateData, contextUser, queryRunner);
            }

            // Assign or update shift if shiftId is provided - within the same transaction
            if (shiftId && existingEmployee.user) {
                await this.userShiftService.assignOrUpdateUserShift(
                    { userId: existingEmployee.user.id, shiftId: shiftId },
                    contextUser,
                    queryRunner
                );
            }

            // Handle employee benefits if provided - within the same transaction
            if (entityRequest.benefits && entityRequest.benefits.length > 0 && existingEmployee.user) {
                // Replace existing benefits with the requested set
                const existingBenefits = await this.employeeBenefitService.getBenefitsByUser(existingEmployee.user.id);
                for (const benefit of existingBenefits) {
                    if (benefit.id) {
                        await this.employeeBenefitService.deleteBenefit(benefit, queryRunner);
                    }
                }

                for (const benefitRequest of entityRequest.benefits) {
                    const employeeBenefit = new EmployeeBenefit().toEntity(
                        {
                            ...benefitRequest,
                            userId: existingEmployee.user.id,
                            employeeId: existingEmployee.id
                        },
                        undefined,
                        contextUser
                    );
                    await this.employeeBenefitService.addBenefit(employeeBenefit, queryRunner);
                }
            }

            await this.employeeRepository.commitTransaction(queryRunner);

            // Return the refreshed employee data
            const refreshedEmployee = await this.employeeRepository.firstOrDefault({
                where: { id },
                relations: {
                    user: true,
                    department: true,
                    designation: true,
                    shift: true,
                    benefits: {
                        benefit: true // Also load the benefit details
                    }
                }
            });

            if (!refreshedEmployee) {
                throw new AppError("Failed to retrieve updated employee.", "500");
            }

            return refreshedEmployee.toResponse();

        } catch (error) {
            await this.employeeRepository.rollbackTransaction(queryRunner);
            throw error;
        }
    }

    // Helper method to validate unique constraints before update
    private async validateUpdateConstraints(
        userId: string,
        userRequest?: IEmployeeRequest['user'],
        employeeRequest?: Partial<IEmployeeRequest>
    ): Promise<void> {
        
        // Get current employee to exclude from uniqueness checks
        const currentEmployee = await this.employeeRepository.firstOrDefault({
            where: { id: userId }
        });

        if (!currentEmployee) {
            throw new AppError("Employee not found.", "404");
        }

        // Validate user fields (username, email) if provided
        if (userRequest) {
            // Check username uniqueness
            if (userRequest.userName) {
                const existingUserWithUsername = await this.userRepository.firstOrDefault({
                    where: { 
                        userName: userRequest.userName,
                        id: Not(currentEmployee.userId)
                    }
                });

                if (existingUserWithUsername) {
                    throw new AppError("Username already exists.", "409");
                }
            }

            // Check email uniqueness
            if (userRequest.email) {
                const existingUserWithEmail = await this.userRepository.firstOrDefault({
                    where: { 
                        email: userRequest.email,
                        id: Not(currentEmployee.userId)
                    }
                });

                if (existingUserWithEmail) {
                    throw new AppError("Email already exists.", "409");
                }
            }
        }

        // Validate employee fields (company code, etc.) if provided
        if (employeeRequest) {
            // Check employee code uniqueness within the company (constraint is companyId + employeeCode)
            if (employeeRequest.employeeCode) {
                const existingEmployeeWithCode = await this.employeeRepository.firstOrDefault({
                    where: {
                        employeeCode: employeeRequest.employeeCode,
                        companyId: currentEmployee.companyId,
                        id: Not(userId) // Exclude current employee
                    }
                });

                if (existingEmployeeWithCode) {
                    throw new AppError("Employee code already exists.", "409");
                }
            }
        }
    }

    public async getStats(contextUser: ITokenUser): Promise<IEmployeeStatsResponse> {

        let employees = await super.get(contextUser);
        let totalEmployees = employees.data.length;
        let activeEmployees = employees.data.filter(emp => emp.active === true).length;
        let inactiveEmployees = employees.data.filter(emp => emp.active === false).length;
        // last 30 days new joinings
        let newJoinings = employees.data.filter(emp =>
            emp.joiningDate &&
            new Date(emp.joiningDate) >= new Date(new Date().setDate(new Date().getDate() - 30))
        ).length;

        return {
            totalEmployees,
            activeEmployees,
            inactiveEmployees,
            newJoinings
        };
    }

    public async onboardEmployee(entityRequest: IEmployeeRequest, contextUser: ITokenUser): Promise<IEmployeeResponse> {
        let userId = contextUser.id;
        let { user: userRequest, shiftId, ...employeeRequest } = entityRequest;

        // get the user from context
        let user = await this.userRepository.firstOrDefault({
            where: { id: userId },
            relations: { role: true }
        });

        if (!user) {
            throw new AppError("User not found in context.", "404");
        }

        // Get the existing employee with user relation
        const existingEmployee = await this.employeeRepository.firstOrDefault({
            where: { userId },
            relations: { user: true }
        });

        // Core: the user update and the employee create/update are applied atomically.
        const queryRunner = await this.employeeRepository.beginTransaction();
        let employeeEntity;
        try {
            // Update user data if provided (regardless of whether employee exists)
            if (userRequest && Object.keys(userRequest).length > 0) {
                // Validate user constraints before updating
                if (userRequest.userName) {
                    const existingUserWithUsername = await this.userRepository.firstOrDefault({
                        where: {
                            userName: userRequest.userName,
                            id: Not(userId)
                        }
                    });

                    if (existingUserWithUsername) {
                        throw new AppError("Username already exists.", "409");
                    }
                }

                if (userRequest.email) {
                    const existingUserWithEmail = await this.userRepository.firstOrDefault({
                        where: {
                            email: userRequest.email,
                            id: Not(userId)
                        }
                    });

                    if (existingUserWithEmail) {
                        throw new AppError("Email already exists.", "409");
                    }
                }

                let userUpdateData: Partial<any> = { ...userRequest };

                // Handle password update separately if provided
                if (userRequest.password) {
                    userUpdateData.passwordHash = await encrypt(userRequest.password);
                    delete userUpdateData.password;
                }

                await this.userRepository.partialUpdate(user.id, userUpdateData, contextUser, queryRunner);

                // Refresh user data after update
                user = await this.userRepository.firstOrDefault({
                    where: { id: userId },
                    relations: { role: true }
                });

                if (!user) {
                    throw new AppError("User not found after update.", "404");
                }
            }

            if (!existingEmployee) {
                // Create new employee record if one doesn't exist
                // Validate constraints for new employee
                if (employeeRequest.employeeCode) {
                    const existingEmployeeWithCode = await this.employeeRepository.firstOrDefault({
                        where: {
                            employeeCode: employeeRequest.employeeCode,
                            companyId: contextUser.companyId
                        }
                    });

                    if (existingEmployeeWithCode) {
                        throw new AppError("Employee code already exists.", "409");
                    }
                }

                let employee = new Employee().toEntity(
                    {
                        ...employeeRequest,
                        userId: user.id,
                        user: user,
                    },
                    undefined,
                    contextUser
                );

                if (employeeRequest.status) {
                    employee.onStatusChange(employeeRequest.status);
                }

                employeeEntity = await this.employeeRepository.invokeDbOperations(employee, Actions.Add, queryRunner);
            } else {
                // For existing employee, validate employee-specific constraints only
                // (user constraints were already validated above)
                if (employeeRequest.employeeCode && employeeRequest.employeeCode !== existingEmployee.employeeCode) {
                    const existingEmployeeWithCode = await this.employeeRepository.firstOrDefault({
                        where: {
                            employeeCode: employeeRequest.employeeCode,
                            companyId: contextUser.companyId,
                            id: Not(existingEmployee.id)
                        }
                    });

                    if (existingEmployeeWithCode) {
                        throw new AppError("Employee code already exists.", "409");
                    }
                }

                // Update existing employee record with new information
                let finalEmployeeUpdateData = { ...employeeRequest } as Partial<Employee>;

                // Handle status change logic if needed
                if (employeeRequest.status && employeeRequest.status !== existingEmployee.status) {
                    existingEmployee.onStatusChange(employeeRequest.status);
                    finalEmployeeUpdateData.status = employeeRequest.status;
                    finalEmployeeUpdateData.active = existingEmployee.active;
                }

                // Only update if there are fields to update
                if (Object.keys(finalEmployeeUpdateData).length > 0) {
                    await this.employeeRepository.partialUpdate(existingEmployee.id, finalEmployeeUpdateData, contextUser, queryRunner);
                }

                employeeEntity = existingEmployee;
            }

            await this.employeeRepository.commitTransaction(queryRunner);
        } catch (error) {
            await this.employeeRepository.rollbackTransaction(queryRunner);
            throw error;
        }

        // Deferred: shift assignment is best-effort and does not roll back onboarding.
        const warnings: IEmployeeSetupWarning[] = [];
        if (shiftId) {
            try {
                await this.userShiftService.assignOrUpdateUserShift(
                    { userId: user.id, shiftId: shiftId },
                    contextUser
                );
            } catch (shiftError) {
                const message = shiftError instanceof Error ? shiftError.message : 'Unknown error occurred';
                warnings.push({ step: 'shift', message: `Failed to assign shift: ${message}` });
            }
        }

        // Return the refreshed employee data
        const refreshedEmployee = await this.employeeRepository.firstOrDefault({
            where: { id: employeeEntity.id },
            relations: { user: true }
        });

        if (!refreshedEmployee) {
            throw new AppError("Failed to retrieve updated employee.", "500");
        }

        const response = refreshedEmployee.toResponse();
        if (warnings.length > 0) {
            response.warnings = warnings;
        }
        return response;
    }

    /**
     * Gets employees with their current shift information
     * @param contextUser - The current user context
     * @returns Promise<IEmployeeResponse[]> - Returns employees with shift data
     */
    async getEmployeesWithShifts(contextUser: ITokenUser): Promise<IEmployeeResponse[]> {
        const employees = await this.employeeRepository.where({
            where: { 
                companyId: contextUser.companyId,
                active: true
            },
            relations: { 
                user: true, 
                department: true, 
                designation: true,
                shift: true, // Load the shift relation
                benefits: {
                    benefit: true // Also load the benefit details
                }
            }
        });

        return employees.map((employee: Employee) => employee.toResponse());
    }

    /**
     * Gets a single employee with shift information
     * @param employeeId - The employee ID
     * @param contextUser - The current user context
     * @returns Promise<IEmployeeResponse | null> - Returns employee with shift data or null
     */
    async getEmployeeWithShift(employeeId: string, contextUser: ITokenUser): Promise<IEmployeeResponse | null> {
        const employee = await this.employeeRepository.firstOrDefault({
            where: { 
                id: employeeId,
                companyId: contextUser.companyId
            },
            relations: { 
                user: true, 
                department: true, 
                designation: true,
                shift: true, // Load the shift relation
                benefits: {
                    benefit: true // Also load the benefit details
                }
            }
        });

        return employee ? employee.toResponse() : null;
    }

}
