import { inject, injectable } from "tsyringe";
import { EmployeeRepository, RoleRepository, UserRepository, AttendanceRepository, VacationRepository, PayrollRepository, CompanyRepository } from "../dal";
import { Employee, Role, User, EmployeeBenefit } from "../entities";
import { Actions, IEmployeeRequest, IEmployeeResponse, IEmployeeSetupWarning, IEmployeeStatsResponse, ITokenUser, EmployeeStatus } from "../models";
import { Service } from "./generics/service";
import { encrypt, generateSetPasswordToken } from "../utility";
import { Not } from "typeorm";
import { AppError } from "../utility/app-error";
import { UserShiftService } from "./user-shift-service";
import { EmployeeBenefitService } from "./employee-benefit-service";
import { reserveNextEmployeeCode, syncEmployeeCodeCounter, previewNextEmployeeCode } from "../utility/employee-code";
import { sendWelcomeEmail, sendSetPasswordEmail, sendEmploymentStatusUpdateEmail } from "../utility/mail-utility";
import { BUSINESS_TIMEZONE } from "../utility/timezone-utility";

@injectable()
export class EmployeeService extends Service<Employee, IEmployeeResponse, IEmployeeRequest> {
    constructor(
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
        @inject('UserRepository') private readonly userRepository: UserRepository,
        @inject('RoleRepository') private readonly roleRepository: RoleRepository,
        @inject('UserShiftService') private readonly userShiftService: UserShiftService,
        @inject('EmployeeBenefitService') private readonly employeeBenefitService: EmployeeBenefitService,
        @inject('AttendanceRepository') private readonly attendanceRepository: AttendanceRepository,
        @inject('VacationRepository') private readonly vacationRepository: VacationRepository,
        @inject('PayrollRepository') private readonly payrollRepository: PayrollRepository,
        @inject('CompanyRepository') private readonly companyRepository: CompanyRepository
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

    // Lets an admin trigger a fresh "Set Your Password" email instead of ever setting or
    // viewing an employee's password directly — passwords are bcrypt-hashed and are never
    // recoverable, so this is the only supported way to help an employee get a new one.
    public async sendSetPasswordEmail(employeeId: string, contextUser: ITokenUser): Promise<boolean> {
        const employee = await this.employeeRepository.firstOrDefault({
            where: { id: employeeId, companyId: contextUser.companyId },
            relations: { user: true },
        });

        if (!employee || !employee.user) {
            throw new AppError("Employee not found.", "404");
        }

        const setPasswordToken = generateSetPasswordToken({ userId: employee.user.id, email: employee.user.email });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const setPasswordLink = `${frontendUrl}/set-new-password?token=${setPasswordToken}`;

        const emailSent = await sendSetPasswordEmail(employee.user.email, {
            name: `${employee.user.firstName} ${employee.user.lastName}`,
            email: employee.user.email,
            setPasswordLink,
        });

        if (!emailSent) {
            throw new AppError("Failed to send the set-password email. Please try again.", "500");
        }

        return true;
    }

    // The generic delete() hard-deletes the Employee row only — it never touches the
    // linked User, so any Attendance/Vacation/Payroll rows (which key off userId, not
    // employeeId, and mostly carry no FK back to Employee) are silently orphaned. A
    // report later joining through user.employee then finds employee undefined and
    // crashes. Block the delete here and point the admin at deactivation instead,
    // which already correctly sets active=false via onStatusChange (see update()).
    public async delete(id: string, contextUser: ITokenUser): Promise<void> {
        const employee = await this.employeeRepository.firstOrDefault({
            where: { id, companyId: contextUser.companyId },
        });
        if (!employee) {
            throw new AppError("Employee not found.", "404");
        }

        const [hasAttendance, hasVacation, hasPayroll] = await Promise.all([
            this.attendanceRepository.firstOrDefault({ where: { userId: employee.userId } }),
            this.vacationRepository.firstOrDefault({ where: { requestedBy: employee.userId } }),
            this.payrollRepository.firstOrDefault({ where: { employeeId: employee.id } }),
        ]);

        if (hasAttendance || hasVacation || hasPayroll) {
            throw new AppError(
                "This employee has attendance, leave, or payroll history and can't be deleted. Set their status to Resigned/Terminated instead to deactivate them while preserving their records.",
                "409"
            );
        }

        return super.delete(id, contextUser);
    }

    // Deactivates an employee who has history (so can't be hard-deleted) instead: sets their
    // status/departureDate via the same onStatusChange rule update() uses, and — unlike
    // update() — also flips the linked User row inactive, since that's the field auth-service
    // actually checks at login. onStatusChange alone only touches Employee.active, which the
    // login check never reads, so without this an admin "deactivating" someone here previously
    // left their account fully able to log in.
    private static readonly RESIGNATION_STATUSES = [EmployeeStatus.RESIGNED, EmployeeStatus.TERMINATED, EmployeeStatus.RETIRED];

    public async resignEmployee(
        id: string,
        request: { status: EmployeeStatus; effectiveDate: Date | string },
        contextUser: ITokenUser
    ): Promise<IEmployeeResponse> {
        if (!EmployeeService.RESIGNATION_STATUSES.includes(request.status)) {
            throw new AppError(
                `Invalid status. Must be one of: ${EmployeeService.RESIGNATION_STATUSES.join(', ')}`,
                "400"
            );
        }

        const queryRunner = await this.employeeRepository.beginTransaction();
        try {
            const existingEmployee = await this.employeeRepository.firstOrDefault({
                where: { id, companyId: contextUser.companyId },
                relations: { user: true },
            });

            if (!existingEmployee || !existingEmployee.user) {
                throw new AppError("Employee not found.", "404");
            }

            existingEmployee.onStatusChange(request.status, request.effectiveDate);

            await this.employeeRepository.partialUpdate(
                existingEmployee.id,
                {
                    status: request.status,
                    active: existingEmployee.active,
                    departureDate: existingEmployee.departureDate,
                },
                contextUser,
                queryRunner,
                ['active']
            );

            await this.userRepository.partialUpdate(
                existingEmployee.user.id,
                { active: false },
                contextUser,
                queryRunner,
                ['active']
            );

            await this.employeeRepository.commitTransaction(queryRunner);

            const effectiveDateStr = new Date(request.effectiveDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', timeZone: BUSINESS_TIMEZONE,
            });
            const emailSent = await sendEmploymentStatusUpdateEmail(existingEmployee.user.email, {
                name: `${existingEmployee.user.firstName} ${existingEmployee.user.lastName}`,
                status: request.status,
                date: effectiveDateStr,
            });
            if (!emailSent) {
                console.error(`Failed to send employment status update email to ${existingEmployee.user.email}`);
            }

            const refreshedEmployee = await this.employeeRepository.firstOrDefault({
                where: { id },
                relations: { user: true, department: true, designation: true, shift: true },
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

    // Read-only suggestion for the Create Employee form's Employee Code field - the
    // admin can freely edit it before submitting. Does not reserve/consume a number.
    public async getNextEmployeeCode(contextUser: ITokenUser): Promise<string> {
        return previewNextEmployeeCode(this.companyRepository, contextUser.companyId);
    }

    public async add(entityRequest: IEmployeeRequest, contextUser: ITokenUser): Promise<IEmployeeResponse> {
        let { user: userRequest, shiftId, benefits, ...employeeRequest } = entityRequest;

        if (!userRequest.password) {
            throw new AppError("Password is required for creating a user.", "400");
        }

        // If the admin left the (pre-filled, editable) suggestion untouched, or omitted
        // it entirely, the code is still explicitly provided in the normal case since the
        // frontend always sends the suggested value - `wasProvided` distinguishes that
        // from a genuinely-omitted code so the counter is only atomically reserved (vs.
        // synced/bumped) when there's nothing for the caller to have provided at all.
        const wasProvided = !!employeeRequest.employeeCode;
        if (!wasProvided) {
            employeeRequest.employeeCode = await reserveNextEmployeeCode(this.companyRepository, contextUser.companyId);
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

        // The employee code was explicitly provided (a manual override, or the
        // auto-suggestion sent back unchanged) rather than reserved just now - move the
        // counter up to match if it's higher, so a manually-typed jump-ahead code is
        // correctly reflected in the next suggestion. Best-effort: the employee is
        // already committed, so a failure here shouldn't surface as a creation failure.
        if (wasProvided) {
            try {
                await syncEmployeeCodeCounter(this.companyRepository, contextUser.companyId, employeeCreated.employeeCode);
            } catch (error) {
                console.warn('Failed to sync employee code counter:', error);
            }
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

        // Best-effort welcome email with a "Set Your Password" link. Does not block or roll
        // back employee creation if it fails — surfaced as a warning instead, same as the
        // benefits/shift steps above.
        try {
            const setPasswordToken = generateSetPasswordToken({ userId: user.id, email: user.email });
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const setPasswordLink = `${frontendUrl}/set-new-password?token=${setPasswordToken}`;

            const emailSent = await sendWelcomeEmail(user.email, {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                setPasswordLink,
            });

            if (!emailSent) {
                console.error(`Failed to send welcome email to ${user.email} for new employee ${employeeCreated.id}`);
                warnings.push({ step: 'welcomeEmail', message: `Failed to send the welcome/set-password email to ${user.email}. Please resend it manually.` });
            }
        } catch (emailError) {
            const message = emailError instanceof Error ? emailError.message : 'Unknown error occurred';
            console.error(`Error sending welcome email for new employee ${employeeCreated.id}:`, emailError);
            warnings.push({ step: 'welcomeEmail', message: `Failed to send the welcome/set-password email: ${message}` });
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

            // Update employee entity if there are employee-specific fields to update.
            // `active` is normally blocked from generic partial updates (mass-assignment
            // defense), but here it's not request-supplied — onStatusChange computed it from
            // the status transition above, so it must be allowed through explicitly.
            if (Object.keys(finalEmployeeUpdateData).length > 0) {
                await this.employeeRepository.partialUpdate(existingEmployee.id, finalEmployeeUpdateData, contextUser, queryRunner, ['active']);
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
        // getAllRecords must be explicit — the default page size is 10, which would
        // silently undercount every stat below once a company has more than 10 employees.
        let employees = await super.get(contextUser, {
            pagedListRequest: { pageNo: 1, pageSize: 1, getAllRecords: true }
        });
        let totalEmployees = employees.data.length;
        let activeEmployees = employees.data.filter(emp => emp.active === true).length;
        let inactiveEmployees = employees.data.filter(emp => emp.active === false).length;
        // "New Hires" tracks when the employee record was added to the system, not their
        // (often backdated) joiningDate — a joiningDate from months/years ago shouldn't
        // count as a new hire just because it was entered today.
        let newJoinings = employees.data.filter(emp =>
            emp.createdAt &&
            new Date(emp.createdAt) >= new Date(new Date().setDate(new Date().getDate() - 30))
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

                // Only update if there are fields to update. See the corresponding comment
                // in update() above — `active` is computed by onStatusChange, not
                // request-supplied, so it must be allowed through the blocklist explicitly.
                if (Object.keys(finalEmployeeUpdateData).length > 0) {
                    await this.employeeRepository.partialUpdate(existingEmployee.id, finalEmployeeUpdateData, contextUser, queryRunner, ['active']);
                }

                employeeEntity = existingEmployee;
            }

            await this.employeeRepository.commitTransaction(queryRunner);
        } catch (error) {
            await this.employeeRepository.rollbackTransaction(queryRunner);
            throw error;
        }

        // Keep the Employee Code counter in sync with a manually-provided code here too
        // (onboarding has its own uniqueness checks above but never reserves/bumps the
        // counter), so a jump-ahead code entered during onboarding is still correctly
        // reflected in the Create Employee form's next suggestion. Best-effort.
        if (!existingEmployee && employeeRequest.employeeCode) {
            try {
                await syncEmployeeCodeCounter(this.companyRepository, contextUser.companyId, employeeEntity.employeeCode);
            } catch (error) {
                console.warn('Failed to sync employee code counter:', error);
            }
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
