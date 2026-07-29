import { inject, injectable } from "tsyringe";
import { PayrollRepository } from "../dal/payroll-repository";
import { PayrollAdjustmentRepository } from "../dal/payroll-adjustment-repository";
import { EmployeeRepository } from "../dal/employee-repository";
import { EmployeeBenefitRepository } from "../dal/employee-benefit-repository";
import { UserRepository } from "../dal/user-repository";
import { DepartmentRepository } from "../dal/department-repository";
import { WorkingDaysRepository } from "../dal/working-days-repository";
import { UserShiftRepository } from "../dal/user-shift-repository";
import { Payroll, PayrollAdjustment } from "../entities";
import {
    IPayrollRequest,
    IPayrollResponse,
    IPayrollAdjustmentRequest,
    IPayrollAdjustmentResponse,
    ISalarySlipGenerationRequest,
    ISalarySlipGenerationResponse,
    IPayrollApprovalRequest,
    ITokenUser,
    IFetchRequest,
    IDataSourceResponse,
    IGetSingleRecordFilter,
    PagedRequest
} from "../models";
import { PayrollStatus, AdjustmentType, AdjustmentCategory, AttendanceStatus } from "../models/enums";
import { AppError } from "../utility/app-error";
import { Service } from "./generics/service";
import { NotificationService } from "./notification-service";
import { Actions, NotificationType } from "../models";
import { TaxCalculatorService } from "./tax-calculator-service";
import { toCurrencyAmount, toInteger, safeSum, calculatePercentage } from "../utility/number-utility";
import { PayrollAdjustmentService } from "./payroll-adjustment-service";
import { AttendanceRepository } from "../dal/attendance-repository";

import { AttendanceService } from "./attendance-service";
import { Between, FindOptionsWhere, IsNull } from "typeorm";
import { buildQuery, setSaurceDataResponse } from "../utility";
import { hasAdminAccess } from "../middlewares/permissions";

@injectable()
export class PayrollService extends Service<Payroll, IPayrollResponse, IPayrollRequest> {
    constructor(
        @inject('PayrollRepository') private payrollRepository: PayrollRepository,
        @inject('PayrollAdjustmentRepository') private adjustmentRepository: PayrollAdjustmentRepository,
        @inject('EmployeeRepository') private employeeRepository: EmployeeRepository,
        @inject('EmployeeBenefitRepository') private employeeBenefitRepository: EmployeeBenefitRepository,
        @inject('UserRepository') private userRepository: UserRepository,
        @inject('DepartmentRepository') private departmentRepository: DepartmentRepository,
        @inject('WorkingDaysRepository') private workingDaysRepository: WorkingDaysRepository,
        @inject('UserShiftRepository') private userShiftRepository: UserShiftRepository,
        @inject('TaxCalculatorService') private taxCalculatorService: TaxCalculatorService,
        @inject('PayrollAdjustmentService') private payrollAdjustmentService: PayrollAdjustmentService,
        @inject('AttendanceRepository') private attendanceRepository: AttendanceRepository,
        @inject('AttendanceService') private attendanceService: AttendanceService,
        @inject('NotificationService') private notificationService: NotificationService
    ) {
        super(payrollRepository, () => new Payroll());
    }

    /**
     * List payrolls. Admins (and super admins) see every payroll in the company;
     * regular employees only ever see their own payslips. The user scope is applied
     * here rather than through the request filters, which the client controls.
     */
    async get(contextUser?: ITokenUser, fetchRequest?: IFetchRequest<IPayrollRequest>): Promise<IDataSourceResponse<IPayrollResponse>> {
        if (!contextUser || hasAdminAccess(contextUser)) {
            return super.get(contextUser, fetchRequest);
        }
        return this.getOwnPayrolls(contextUser, fetchRequest);
    }

    /**
     * Fetch a single payroll by id. Employees may only read their own; an attempt to
     * read someone else's surfaces the same "not found" as a missing record.
     */
    async getById(id: string, contextUser?: ITokenUser): Promise<IPayrollResponse | null> {
        const payroll = await super.getById(id, contextUser);
        if (payroll && contextUser && !hasAdminAccess(contextUser) && payroll.userId !== contextUser.id) {
            throw new AppError('Payroll not found', '404');
        }
        return payroll;
    }

    /**
     * Fetch a single payroll by query. Employees only ever resolve their own record.
     */
    async getOne(contextUser: ITokenUser, filtersRequest: IGetSingleRecordFilter<IPayrollRequest>): Promise<IPayrollResponse | null> {
        const payroll = await super.getOne(contextUser, filtersRequest);
        if (payroll && !hasAdminAccess(contextUser) && payroll.userId !== contextUser.id) {
            return null;
        }
        return payroll;
    }

    private async getOwnPayrolls(contextUser: ITokenUser, fetchRequest?: IFetchRequest<IPayrollRequest>): Promise<IDataSourceResponse<IPayrollResponse>> {
        const request = (fetchRequest ?? {}) as any as IFetchRequest<Payroll>;
        if (!request.pagedListRequest) request.pagedListRequest = new PagedRequest();

        // Reuse the standard query for sorting/paging/relations, then hard-override the
        // where clause so an employee can only ever read rows scoped to their own userId.
        const query = buildQuery(request, false, true, contextUser.companyId);
        query.where = {
            companyId: contextUser.companyId,
            userId: contextUser.id,
            deleted: false
        } as FindOptionsWhere<Payroll>;

        const payrolls = await this.payrollRepository.where(query);
        const total = await this.payrollRepository.entityCount(query.where);
        return setSaurceDataResponse<Payroll, IPayrollResponse>(payrolls, total, request.pagedListRequest.pageSize, request.pagedListRequest.pageNo);
    }


    /**
     * Calculate total benefits for an employee
     * @param employee - The employee object with benefits
     * @returns Object containing total benefits and individual benefit calculations
     */
    private calculateEmployeeBenefits(employee: any, asOf: Date): {
        totalBenefits: number;
        benefitCalculations: Array<{
            benefitName: string;
            amount: number;
            type: string;
            originalValue?: number;
            percentage?: number;
        }>
    } {
        let totalBenefits: number = 0;
        const benefitCalculations: Array<{
            benefitName: string;
            amount: number;
            type: string;
            originalValue?: number;
            percentage?: number;
        }> = [];

        if (!employee.benefits || employee.benefits.length === 0) {
            return { totalBenefits: 0, benefitCalculations: [] };
        }

        for (const employeeBenefit of employee.benefits) {
            // Only include benefits that were effective during the payroll period being processed.
            if (employeeBenefit.isEffective(asOf)) {
                const benefitValue = employeeBenefit.getActualValue();

                if (benefitValue !== null && benefitValue !== undefined && !isNaN(Number(benefitValue))) {
                    let benefitAmount = 0;
                    let calculationType = '';

                    // Check if it's a custom value (overrides benefit default)
                    if (employeeBenefit.customValue !== null && employeeBenefit.customValue !== undefined) {
                        // Use custom value directly
                        benefitAmount = toCurrencyAmount(employeeBenefit.customValue);
                        calculationType = 'Custom Value';
                    } else if (employeeBenefit.benefit) {
                        // Use benefit's value type logic
                        if (employeeBenefit.benefit.valueType === 'PERCENTAGE') {
                            // Calculate percentage of base salary
                            benefitAmount = calculatePercentage(employee.salary, benefitValue);
                            calculationType = 'Percentage';
                        } else {
                            // Fixed amount
                            benefitAmount = toCurrencyAmount(benefitValue);
                            calculationType = 'Fixed Amount';
                        }
                    }

                    if (benefitAmount > 0) {
                        totalBenefits = safeSum(totalBenefits, benefitAmount);
                        benefitCalculations.push({
                            benefitName: employeeBenefit.benefit?.name || 'Unknown Benefit',
                            amount: benefitAmount,
                            type: calculationType,
                            originalValue: benefitValue,
                            percentage: employeeBenefit.benefit?.valueType === 'PERCENTAGE' ? benefitValue : undefined
                        });
                    }
                }
            }
        }

        return { totalBenefits, benefitCalculations };
    }

    /**
     * Generic function to create payroll adjustments in bulk or individually
     * 
     * @param adjustmentData - Single adjustment request or array of adjustment requests
     * @param contextUser - The user context for database operations
     * @returns Object containing created adjustments and count
     */
    private async adjustmentCreation(
        adjustmentData: IPayrollAdjustmentRequest | IPayrollAdjustmentRequest[],
        contextUser: ITokenUser
    ): Promise<{ adjustments: PayrollAdjustment[], adjustmentsCreated: number }> {
        // Ensure we always work with an array
        const adjustmentsArray = Array.isArray(adjustmentData) ? adjustmentData : [adjustmentData];

        if (adjustmentsArray.length === 0) {
            return { adjustments: [], adjustmentsCreated: 0 };
        }

        try {
            // Create adjustment entities
            const adjustmentEntities: PayrollAdjustment[] = adjustmentsArray.map(request => {
                const adjustment = new PayrollAdjustment();
                adjustment.toEntity(request, undefined, contextUser);
                return adjustment;
            });

            // Use bulk insert for better performance
            const createdAdjustments = await this.adjustmentRepository.invokeDbOperationsRange(
                adjustmentEntities,
                Actions.Add
            );

            console.log(`Successfully created ${createdAdjustments.length} adjustments in bulk`);

            return {
                adjustments: createdAdjustments,
                adjustmentsCreated: createdAdjustments.length
            };

        } catch (error) {
            console.error('Error in bulk adjustment creation:', error);
            throw error; // Return the error instead of fallback
        }
    }

    async generateSalarySlips(request: ISalarySlipGenerationRequest, contextUser: ITokenUser): Promise<ISalarySlipGenerationResponse> {
        const { departmentIds, payrollMonth, payrollYear, notes } = request;

        // Validate input
        if (!departmentIds || departmentIds.length === 0) {
            throw new AppError('At least one department ID is required', '400');
        }

        if (payrollMonth < 1 || payrollMonth > 12) {
            throw new AppError('Payroll month must be between 1 and 12', '400');
        }

        if (payrollYear < 2020 || payrollYear > 2030) {
            throw new AppError('Payroll year must be between 2020 and 2030', '400');
        }

        const generatedPayrolls: IPayrollResponse[] = [];
        const notifyUserIds: string[] = [];
        const errors: string[] = [];
        let totalAmount = 0;

        try {
            // Step 1: Calculate month start and end dates
            const monthStartDate = new Date(payrollYear, payrollMonth - 1, 1);
            const monthEndDate = new Date(payrollYear, payrollMonth, 0);

            console.log(`Processing payroll for month: ${payrollMonth}/${payrollYear}`);

            // Step 2: Loop through each department
            for (const departmentId of departmentIds) {
                console.log(`Processing department: ${departmentId}`);

                // Step 3: Get working days — prefer department-specific rows, fall back to
                // company-wide rows (departmentId IS NULL) if none are configured per-department.
                let workingDays = await this.workingDaysRepository.where({
                    where: {
                        departmentId: departmentId,
                        companyId: contextUser.companyId
                    }
                });
                if (workingDays.length === 0) {
                    workingDays = await this.workingDaysRepository.where({
                        where: {
                            departmentId: IsNull(),
                            companyId: contextUser.companyId
                        }
                    });
                }

                // Calculate total working days for the month
                const workingDaysInfo = this.calculateWorkingDaysForMonth(workingDays, monthStartDate, monthEndDate);
                console.log(`Department ${departmentId} has ${workingDaysInfo.totalWorkingDays} working days, ${workingDaysInfo.monthDays} total month days, and ${workingDaysInfo.offDays} off days`);

                // Step 4: Get employees for this department
                const employees = await this.employeeRepository.where({
                    where: {
                        departmentId: departmentId,
                        companyId: contextUser.companyId,
                        active: true
                    },
                    relations: {
                        user: true,
                        department: true,
                        benefits: {
                            benefit: true
                        },
                        shift: true
                    }
                });

                console.log(`Found ${employees.length} employees in department ${departmentId}`);

                // Step 5: Apply salary calculation logic on these employees
                for (const employee of employees) {
                    try {
                        // Check if payroll already exists
                        const existingPayroll = await this.payrollRepository.where({
                            where: {
                                employeeId: employee.id,
                                payrollMonth,
                                payrollYear,
                                companyId: contextUser.companyId
                            }
                        });

                        if (existingPayroll.length > 0) {
                            const existing = existingPayroll[0];
                            if (existing.status !== PayrollStatus.DRAFT) {
                                // Non-DRAFT payrolls (PENDING/APPROVED/PAID/CANCELLED) cannot be regenerated.
                                errors.push(`Payroll for ${employee.employeeCode} (${payrollMonth}/${payrollYear}) is already in ${existing.status} status — skipped.`);
                                continue;
                            }
                            // DRAFT: delete existing adjustments first (no cascade), then the payroll,
                            // so it gets fully recalculated below.
                            const existingAdjustments = await this.adjustmentRepository.where({
                                where: { payrollId: existing.id, companyId: contextUser.companyId }
                            });
                            if (existingAdjustments.length > 0) {
                                await this.adjustmentRepository.invokeDbOperationsRange(existingAdjustments, Actions.Delete);
                            }
                            await this.payrollRepository.invokeDbOperations(existing, Actions.Delete);
                        }

                        // Step 5.1: Fetch attendance records for this employee for the payroll month.
                        // deleted: false ensures soft-deleted records don't distort the counts.
                        const attendanceRecords = await this.attendanceRepository.where({
                            where: {
                                userId: employee.userId,
                                companyId: contextUser.companyId,
                                date: Between(monthStartDate, monthEndDate),
                                deleted: false
                            }
                        });

                        console.log(`Found ${attendanceRecords.length} attendance records for employee ${employee.employeeCode}`);

                        // Step 5.2: Calculate attendance statistics and create attendance summary
                        const attendanceStats = await this.attendanceService.calculateAttendanceStats(
                            attendanceRecords,
                            workingDaysInfo,
                            employee.id,
                            employee.userId,
                            employee.departmentId,
                            payrollMonth,
                            payrollYear,
                            contextUser,
                            employee.shift?.marginTime ?? 0 // grace margin: lateness within it isn't penalised
                        );
                        console.log(`Employee ${employee.employeeCode} attendance stats:`, attendanceStats);

                        // Log any missing attendance records
                        const daysWithAttendance = attendanceRecords.length;
                        if (daysWithAttendance < workingDaysInfo.totalWorkingDays) {
                            console.log(`Warning: Employee ${employee.employeeCode} has ${daysWithAttendance} attendance records but ${workingDaysInfo.totalWorkingDays} working days. Missing records for ${workingDaysInfo.totalWorkingDays - daysWithAttendance} days.`);
                        }

                        // Calculate benefits — pass monthEndDate so effectiveness is checked
                        // against the payroll period, not today's date.
                        const { totalBenefits, benefitCalculations } = this.calculateEmployeeBenefits(employee, monthEndDate);

                        // Calculate tax
                        const basicSalary = toCurrencyAmount(employee.salary, 0);
                        const taxCalculation = this.taxCalculatorService.calculateTax(basicSalary, 'monthly');
                        const monthlyTax = toCurrencyAmount(taxCalculation.monthlyTax, 0);

                        // Calculate per day and per hour salary
                        const perDaySalary = this.calculatePerDaySalary(basicSalary, workingDaysInfo.totalWorkingDays);
                        const workingHoursPerDay = employee.shift ? (employee.shift.workingHours / 60) : 8; // Default to 8 hours if no shift
                        const perHourSalary = this.calculatePerHourSalary(perDaySalary, workingHoursPerDay);

                        // Calculate deductions based on attendance
                        const absentDeductions = this.calculateAbsentDeductions(attendanceStats.absentDays, perDaySalary);
                        const earlyLeaveDeductions = this.calculateEarlyLeaveDeductions(attendanceStats.totalEarlyLeaveHours, perHourSalary);
                        const lateDeductions = this.calculateLateDeductions(attendanceStats.totalLateHours, perHourSalary);

                        // Calculate final salary
                        const finalSalaryCalculation = this.calculateFinalSalary(
                            basicSalary,
                            totalBenefits,
                            absentDeductions,
                            earlyLeaveDeductions,
                            lateDeductions,
                            monthlyTax
                        );

                        // Create simple payroll notes
                        const payrollNotes = `Payroll ${payrollMonth}/${payrollYear} | Working Days: ${workingDaysInfo.totalWorkingDays} | Present: ${attendanceStats.presentDays}, Absent: ${attendanceStats.absentDays}, Leave: ${attendanceStats.leaveDays} | Public Holiday: ${attendanceStats.holidayDays} | Early Leave: ${attendanceStats.totalEarlyLeaveHours}h | Late: ${attendanceStats.totalLateHours}h | Basic: ${basicSalary} PKR | Per Day: ${perDaySalary} PKR | Deductions: Absent(${absentDeductions} PKR), Early Leave(${earlyLeaveDeductions} PKR), Late(${lateDeductions} PKR), Tax(${monthlyTax} PKR) | Net: ${finalSalaryCalculation.netSalary} PKR${notes ? ` | Notes: ${notes}` : ''}`;

                        // Create payroll record
                        const payrollRequest: IPayrollRequest = {
                            employeeId: employee.id,
                            userId: employee.userId,
                            departmentId: employee.departmentId,
                            payrollMonth,
                            payrollYear,
                            status: PayrollStatus.DRAFT,
                            basicSalary: basicSalary,
                            grossSalary: finalSalaryCalculation.grossSalary,
                            netSalary: finalSalaryCalculation.netSalary,
                            incomeTax: monthlyTax,
                            totalAdditions: totalBenefits,
                            totalDeductions: finalSalaryCalculation.totalDeductions,
                            notes: payrollNotes
                        };

                        // Create and save payroll
                        const payroll = new Payroll();
                        payroll.toEntity(payrollRequest, undefined, contextUser);
                        const savedPayroll = await this.payrollRepository.invokeDbOperationsWithResponse(payroll, Actions.Add);

                        // Create adjustments
                        const allAdjustmentRequests: IPayrollAdjustmentRequest[] = [];

                        // Add benefit adjustments
                        benefitCalculations.forEach(benefitCalc => {
                            allAdjustmentRequests.push({
                                payrollId: savedPayroll.id,
                                employeeId: employee.id,
                                adjustmentType: AdjustmentType.ADDITION,
                                category: AdjustmentCategory.BENEFIT,
                                title: benefitCalc.benefitName,
                                description: `Benefit: ${benefitCalc.benefitName} (${benefitCalc.type})`,
                                amount: benefitCalc.amount
                            });
                        });

                        // Add tax adjustment
                        if (monthlyTax > 0) {
                            allAdjustmentRequests.push({
                                payrollId: savedPayroll.id,
                                employeeId: employee.id,
                                adjustmentType: AdjustmentType.DEDUCTION,
                                category: AdjustmentCategory.TAX,
                                title: 'Income Tax (Pakistan 2025-26)',
                                description: `Monthly income tax calculated based on Pakistan tax slabs for FY 2025-26`,
                                amount: monthlyTax
                            });
                        }

                        // Add absent day deductions
                        if (absentDeductions > 0) {
                            allAdjustmentRequests.push({
                                payrollId: savedPayroll.id,
                                employeeId: employee.id,
                                adjustmentType: AdjustmentType.DEDUCTION,
                                category: AdjustmentCategory.ABSENT,
                                title: 'Absent Day Deductions',
                                description: `Deduction for ${attendanceStats.absentDays} absent days (${perDaySalary} per day)`,
                                amount: absentDeductions
                            });
                        }

                        // Add early leave deductions
                        if (earlyLeaveDeductions > 0) {
                            allAdjustmentRequests.push({
                                payrollId: savedPayroll.id,
                                employeeId: employee.id,
                                adjustmentType: AdjustmentType.DEDUCTION,
                                category: AdjustmentCategory.EARLY_LEAVE,
                                title: 'Early Leave Deductions',
                                description: `Deduction for ${attendanceStats.totalEarlyLeaveHours} early leave hours (${perHourSalary} per hour)`,
                                amount: earlyLeaveDeductions
                            });
                        }

                        // Add late arrival deductions (lateness beyond the shift's grace margin)
                        if (lateDeductions > 0) {
                            allAdjustmentRequests.push({
                                payrollId: savedPayroll.id,
                                employeeId: employee.id,
                                adjustmentType: AdjustmentType.DEDUCTION,
                                category: AdjustmentCategory.LATE,
                                title: 'Late Arrival Deductions',
                                description: `Deduction for ${attendanceStats.totalLateHours} late hours beyond grace (${perHourSalary} per hour)`,
                                amount: lateDeductions
                            });
                        }

                        // Create adjustments and update totals
                        const { adjustmentsCreated } = await this.adjustmentCreation(allAdjustmentRequests, contextUser);
                        await this.payrollAdjustmentService.updatePayrollTotals(savedPayroll.id, contextUser);

                        console.log(`Created payroll for employee ${employee.employeeCode} with ${workingDaysInfo.totalWorkingDays} working days and attendance: Present=${attendanceStats.presentDays}, Absent=${attendanceStats.absentDays}, Leave=${attendanceStats.leaveDays}, Holiday=${attendanceStats.holidayDays}`);
                        console.log(`Working Hours - Total: ${attendanceStats.totalWorkingHours}, Expected: ${attendanceStats.totalExpectedWorkingHours}, Actual: ${attendanceStats.totalLockedWorkingHours}`);
                        console.log(`Early Leave - Days: ${attendanceStats.earlyLeaveDays}, Total Hours: ${attendanceStats.totalEarlyLeaveHours}`);
                        console.log(`Salary Calculations - Basic: ${basicSalary}, Per Day: ${perDaySalary}, Per Hour: ${perHourSalary}`);
                        console.log(`Deductions - Absent: ${absentDeductions}, Early Leave: ${earlyLeaveDeductions}, Late: ${lateDeductions}, Tax: ${monthlyTax}, Total: ${finalSalaryCalculation.totalDeductions}`);
                        console.log(`Final Salary - Gross: ${finalSalaryCalculation.grossSalary}, Net: ${finalSalaryCalculation.netSalary}`);
                        console.log(`📝 Generated comprehensive payroll notes with detailed breakdown`);

                        generatedPayrolls.push(savedPayroll);
                        if (employee.userId) notifyUserIds.push(employee.userId);
                        totalAmount = safeSum(totalAmount, savedPayroll.netSalary);

                    } catch (error) {
                        const errorMessage = `Error processing employee ${employee.employeeCode}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        errors.push(errorMessage);
                    }
                }
            }

            // Notify each employee who got a payslip. Best-effort — never let notification
            // failures break slip generation.
            if (notifyUserIds.length > 0) {
                try {
                    const period = `${String(payrollMonth).padStart(2, "0")}/${payrollYear}`;
                    await this.notificationService.createForUsers(
                        notifyUserIds,
                        {
                            title: "Payslip available",
                            message: `Your payslip for ${period} has been generated and is now available.`,
                            type: NotificationType.PAYSLIP,
                        },
                        contextUser
                    );
                } catch {
                    // payrolls already generated; notifications are non-critical.
                }
            }

            return {
                success: generatedPayrolls.length > 0,
                message: `Successfully generated ${generatedPayrolls.length} salary slips`,
                generatedPayrolls: generatedPayrolls.length,
                totalEmployees: generatedPayrolls.length,
                totalAmount,
                payrolls: generatedPayrolls,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            throw new AppError(`Error generating salary slips: ${error instanceof Error ? error.message : 'Unknown error'}`, '500');
        }
    }


    /**
     * Calculate per day salary based on basic salary and working days
     * @param basicSalary - Basic monthly salary
     * @param totalWorkingDays - Total working days in the month
     * @returns Per day salary amount
     */
    private calculatePerDaySalary(basicSalary: number, totalWorkingDays: number): number {
        if (totalWorkingDays <= 0) {
            return 0;
        }
        return Math.round(basicSalary / totalWorkingDays);
    }

    /**
     * Calculate per hour salary based on per day salary and working hours per day
     * @param perDaySalary - Salary per day
     * @param workingHoursPerDay - Working hours per day (from shift)
     * @returns Per hour salary amount
     */
    private calculatePerHourSalary(perDaySalary: number, workingHoursPerDay: number): number {
        if (workingHoursPerDay <= 0) {
            return 0;
        }
        return Math.round(perDaySalary / workingHoursPerDay);
    }

    /**
     * Calculate absent day deductions
     * @param absentDays - Number of absent days
     * @param perDaySalary - Salary per day
     * @returns Total absent deduction amount
     */
    private calculateAbsentDeductions(absentDays: number, perDaySalary: number): number {
        return absentDays * perDaySalary;
    }

    /**
     * Calculate early leave hour deductions
     * @param totalEarlyLeaveHours - Total early leave hours
     * @param perHourSalary - Salary per hour
     * @returns Total early leave deduction amount
     */
    private calculateEarlyLeaveDeductions(totalEarlyLeaveHours: number, perHourSalary: number): number {
        return Math.round(totalEarlyLeaveHours * perHourSalary);
    }

    /**
     * Calculate late arrival deductions. totalLateHours already excludes the shift grace margin.
     * @param totalLateHours - Total late hours beyond the shift's grace margin
     * @param perHourSalary - Salary per hour
     * @returns Total late deduction amount
     */
    private calculateLateDeductions(totalLateHours: number, perHourSalary: number): number {
        return Math.round(totalLateHours * perHourSalary);
    }

    /**
     * Calculate final salary with all deductions and additions
     * @param basicSalary - Basic monthly salary
     * @param totalBenefits - Total benefits amount
     * @param absentDeductions - Absent day deductions
     * @param earlyLeaveDeductions - Early leave hour deductions
     * @param incomeTax - Income tax amount
     * @returns Object containing gross salary, total deductions, and net salary
     */
    private calculateFinalSalary(
        basicSalary: number,
        totalBenefits: number,
        absentDeductions: number,
        earlyLeaveDeductions: number,
        lateDeductions: number,
        incomeTax: number
    ): {
        grossSalary: number;
        totalDeductions: number;
        netSalary: number;
    } {
        // Gross salary = Basic salary + Benefits
        const grossSalary = basicSalary + totalBenefits;

        // Total deductions = Absent + Early leave + Late + Income tax
        const totalDeductions = absentDeductions + earlyLeaveDeductions + lateDeductions + incomeTax;
        
        // Net salary = Gross salary - Total deductions
        const netSalary = Math.max(0, grossSalary - totalDeductions);
        
        return {
            grossSalary,
            totalDeductions,
            netSalary
        };
    }

    /**
     * Simple method to calculate working days for a month based on WorkingDays entity
     */
    private calculateWorkingDaysForMonth(workingDays: any[], monthStartDate: Date, monthEndDate: Date): {
        totalWorkingDays: number;
        monthDays: number;
        offDays: number;
    } {
        let totalWorkingDays = 0;
        let monthDays = 0;
        let offDays = 0;
        const currentDate = new Date(monthStartDate);

        while (currentDate <= monthEndDate) {
            monthDays++; // Count all days in the month
            const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
            const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1=Monday, 7=Sunday format

            // Check if this day is a working day from WorkingDays entity
            const workingDayConfig = workingDays.find(wd => wd.dayOfWeek === adjustedDayOfWeek);

            if (workingDayConfig && workingDayConfig.isWorkingDay) {
                totalWorkingDays++;
            } else {
                offDays++;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return { totalWorkingDays, monthDays, offDays };
    }

    /**
     * Approve or reject a payroll - Admin only functionality
     * @param request - Payroll approval request containing payroll ID, status, and optional notes
     * @param contextUser - The user context for database operations
     * @returns Updated payroll response
     */
    async approvePayroll(request: IPayrollApprovalRequest, contextUser: ITokenUser): Promise<IPayrollResponse> {
        const { payrollId, status, notes } = request;

        try {
            // Get the payroll record, scoped to the caller's company so an admin can't
            // approve/reject another company's payroll by id. A super admin acting on a company
            // carries that company as contextUser.companyId (set in validateCompanyHeader).
            const payroll = await this.payrollRepository.firstOrDefault({ where: { id: payrollId, companyId: contextUser.companyId } });

            if (!payroll) {
                throw new AppError('Payroll not found', '404');
            }

            // Check if payroll is in a state that can be approved/rejected
            if (payroll.status === PayrollStatus.APPROVED) {
                throw new AppError('Payroll is already approved', '400');
            }

            if (payroll.status === PayrollStatus.PAID) {
                throw new AppError('Cannot modify payroll that has already been paid', '400');
            }

            if (payroll.status === PayrollStatus.CANCELLED) {
                throw new AppError('Cannot modify cancelled payroll', '400');
            }

            // Update payroll status and approval details
            payroll.status = status;
            payroll.approvedAt = new Date();
            payroll.approvedBy = contextUser.id;
            
            if (notes) {
                payroll.notes = payroll.notes ? `${payroll.notes}\n\nApproval Notes: ${notes}` : `Approval Notes: ${notes}`;
            }

            // Save the updated payroll
            const updatedPayroll = await this.payrollRepository.invokeDbOperationsWithResponse(payroll, Actions.Update);

            console.log(`Payroll ${payrollId} ${status.toLowerCase()} by user ${contextUser.name} (${contextUser.id})`);
            
            return updatedPayroll;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Error updating payroll status: ${error instanceof Error ? error.message : 'Unknown error'}`, '500');
        }
    }


}