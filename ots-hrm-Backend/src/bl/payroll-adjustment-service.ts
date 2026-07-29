import { inject, injectable } from "tsyringe";
import { PayrollAdjustmentRepository } from "../dal/payroll-adjustment-repository";
import { PayrollRepository } from "../dal/payroll-repository";
import { EmployeeRepository } from "../dal/employee-repository";
import { PayrollAdjustment } from "../entities";
import {
    IPayrollAdjustmentRequest,
    IPayrollAdjustmentResponse,
    IManualAdjustmentRequest,
    IManualAdjustmentResponse,
    ITokenUser
} from "../models";
import { AdjustmentType, AdjustmentCategory, PayrollStatus } from "../models/enums";
import { AppError } from "../utility/app-error";
import { Service } from "./generics/service";
import { Actions } from "../models";
import { toCurrencyAmount, safeSum } from "../utility/number-utility";
import { hasAdminAccess } from "../middlewares/permissions";

@injectable()
export class PayrollAdjustmentService extends Service<PayrollAdjustment, IPayrollAdjustmentResponse, IPayrollAdjustmentRequest> {
    constructor(
        @inject('PayrollAdjustmentRepository') private adjustmentRepository: PayrollAdjustmentRepository,
        @inject('PayrollRepository') private payrollRepository: PayrollRepository,
        @inject('EmployeeRepository') private employeeRepository: EmployeeRepository
    ) {
        super(adjustmentRepository, () => new PayrollAdjustment());
    }

    /**
     * Add manual adjustments to a payroll
     * @param payrollId - The payroll ID from URL parameter
     * @param request - The manual adjustment request containing array of adjustments
     * @param contextUser - The user context for database operations
     * @returns Response with created adjustments and totals
     */
    async addManualAdjustments(payrollId: string, request: IManualAdjustmentRequest, contextUser: ITokenUser): Promise<IManualAdjustmentResponse> {
        const { adjustments } = request;
        const createdAdjustments: IPayrollAdjustmentResponse[] = [];
        const errors: string[] = [];
        let totalAdditions = 0;
        let totalDeductions = 0;
        let adjustmentsCreated = 0;

        try {
            // Validate payroll exists and belongs to the company
            const payroll = await this.payrollRepository.findOneByIdWithCompanyVerification(payrollId, contextUser.companyId);
            if (!payroll) {
                throw new AppError('Payroll not found', '404');
            }

            // Check if payroll is in editable state
            if (payroll.status !== PayrollStatus.DRAFT) {
                throw new AppError('Payroll is not in draft status. Cannot add adjustments.', '400');
            }

            // Validate adjustments array
            if (!adjustments || adjustments.length === 0) {
                throw new AppError('At least one adjustment is required', '400');
            }

            // Process each adjustment
            for (const adjustmentData of adjustments) {
                try {
                    // Validate employee exists and belongs to the company
                    const employee = await this.employeeRepository.findOneByIdWithCompanyVerification(adjustmentData.employeeId, contextUser.companyId);
                    if (!employee) {
                        errors.push(`Employee not found: ${adjustmentData.employeeId}`);
                        continue;
                    }

                    // Validate amount is positive
                    if (adjustmentData.amount <= 0) {
                        errors.push(`Invalid amount for adjustment "${adjustmentData.title}": Amount must be greater than 0`);
                        continue;
                    }

                    // Validate adjustment type and category
                    if (!Object.values(AdjustmentType).includes(adjustmentData.adjustmentType)) {
                        errors.push(`Invalid adjustment type: ${adjustmentData.adjustmentType}`);
                        continue;
                    }

                    if (!Object.values(AdjustmentCategory).includes(adjustmentData.category)) {
                        errors.push(`Invalid adjustment category: ${adjustmentData.category}`);
                        continue;
                    }

                    // Create adjustment request
                    const adjustmentRequest: IPayrollAdjustmentRequest = {
                        payrollId: payrollId,
                        employeeId: adjustmentData.employeeId,
                        adjustmentType: adjustmentData.adjustmentType,
                        category: adjustmentData.category,
                        title: adjustmentData.title,
                        description: adjustmentData.description,
                        amount: adjustmentData.amount,
                        manual: false // Set to false for manual adjustments via API
                    };

                    // Create and save adjustment
                    const adjustment = new PayrollAdjustment();
                    adjustment.toEntity(adjustmentRequest, undefined, contextUser);
                    const savedAdjustment = await this.adjustmentRepository.invokeDbOperationsWithResponse(adjustment, Actions.Add);

                    // Add to totals - use utility functions for safe number operations
                    if (adjustmentData.adjustmentType === AdjustmentType.ADDITION) {
                        totalAdditions = safeSum(totalAdditions, adjustmentData.amount);
                    } else {
                        totalDeductions = safeSum(totalDeductions, adjustmentData.amount);
                    }

                    createdAdjustments.push(savedAdjustment);
                    adjustmentsCreated++;

                } catch (error) {
                    const errorMessage = `Error creating adjustment "${adjustmentData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMessage);
                }
            }

            // Update payroll totals if adjustments were created successfully
            if (adjustmentsCreated > 0) {
                await this.updatePayrollTotals(payrollId, contextUser);
            }

            return {
                success: adjustmentsCreated > 0,
                message: `Successfully created ${adjustmentsCreated} adjustments`,
                adjustmentsCreated,
                totalAdditions,
                totalDeductions,
                adjustments: createdAdjustments,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            throw new AppError(`Error adding manual adjustments: ${error instanceof Error ? error.message : 'Unknown error'}`, '500');
        }
    }

    /**
     * Get all adjustments for a specific payroll
     * @param payrollId - The payroll ID
     * @param contextUser - The user context
     * @returns Array of adjustments
     */
    async getAdjustmentsByPayroll(payrollId: string, contextUser: ITokenUser): Promise<IPayrollAdjustmentResponse[]> {
        // Employees may only read the breakdown of their own payslip. Admins see any
        // payroll in the company. Kept outside the try below so the 404 isn't re-wrapped as a 500.
        if (!hasAdminAccess(contextUser)) {
            const payroll = await this.payrollRepository.findOneByIdWithCompanyVerification(payrollId, contextUser.companyId);
            if (!payroll || payroll.userId !== contextUser.id) {
                throw new AppError('Payroll not found', '404');
            }
        }

        try {
            const adjustments = await this.adjustmentRepository.where({
                where: {
                    payrollId: payrollId,
                    companyId: contextUser.companyId
                },
                relations: {
                    payroll: true,
                    employee: {
                        user: true
                    }
                },
                order: {
                    createdAt: 'ASC'
                }
            });

            return adjustments.map(adjustment => adjustment.toResponse());
        } catch (error) {
            throw new AppError(`Error retrieving adjustments: ${error instanceof Error ? error.message : 'Unknown error'}`, '500');
        }
    }

    /**
     * Delete a specific adjustment
     * @param adjustmentId - The adjustment ID
     * @param contextUser - The user context
     * @returns Success response
     */
    async deleteAdjustment(adjustmentId: string, contextUser: ITokenUser): Promise<{ success: boolean; message: string }> {
        try {
            // Get the adjustment to check if payroll is editable
            const adjustment = await this.adjustmentRepository.findOneByIdWithCompanyVerification(adjustmentId, contextUser.companyId);
            if (!adjustment) {
                throw new AppError('Adjustment not found', '404');
            }

            // Admins may remove both manual and system-generated adjustments, as long as the
            // payroll is still editable (draft). Totals are recomputed after deletion.
            const payroll = await this.payrollRepository.findOneByIdWithCompanyVerification(adjustment.payrollId, contextUser.companyId);
            if (payroll && payroll.status !== PayrollStatus.DRAFT) {
                throw new AppError('Payroll is not in draft status. Cannot delete adjustments.', '400');
            }

            // Delete the adjustment
            await this.adjustmentRepository.invokeDbOperations(adjustment, Actions.Delete);

            // Update payroll totals
            await this.updatePayrollTotals(adjustment.payrollId, contextUser);

            return {
                success: true,
                message: 'Adjustment deleted successfully'
            };
        } catch (error) {
            throw new AppError(`${error instanceof Error ? error.message : 'Unknown error'}`, '500');
        }
    }

    /**
     * Update payroll totals based on adjustments
     * @param payrollId - The payroll ID
     * @param contextUser - The user context
     */
    async updatePayrollTotals(payrollId: string, contextUser: ITokenUser): Promise<void> {
        try {
            // Get all adjustments for this payroll
            const adjustments = await this.adjustmentRepository.where({
                where: {
                    payrollId: payrollId,
                    companyId: contextUser.companyId
                }
            });

            // Calculate totals - use utility functions for safe number operations
            let totalAdditions = 0;
            let totalDeductions = 0;

            console.log(`=== UPDATE PAYROLL TOTALS DEBUG ===`);
            console.log(`Processing ${adjustments.length} adjustments for payroll ${payrollId}`);

            for (const adjustment of adjustments) {
                console.log(`Adjustment:`, {
                    id: adjustment.id,
                    type: adjustment.adjustmentType,
                    amount: adjustment.amount,
                    amountType: typeof adjustment.amount
                });

                if (adjustment.adjustmentType === AdjustmentType.ADDITION) {
                    const oldTotal = totalAdditions;
                    totalAdditions = safeSum(totalAdditions, adjustment.amount);
                    console.log(`Addition: ${oldTotal} + ${adjustment.amount} = ${totalAdditions}`);
                } else {
                    const oldTotal = totalDeductions;
                    totalDeductions = safeSum(totalDeductions, adjustment.amount);
                    console.log(`Deduction: ${oldTotal} + ${adjustment.amount} = ${totalDeductions}`);
                }
            }

            console.log(`Final totals: Additions=${totalAdditions}, Deductions=${totalDeductions}`);
            console.log(`=== END UPDATE PAYROLL TOTALS DEBUG ===`);

            // Get the payroll
            const payroll = await this.payrollRepository.findOneByIdWithCompanyVerification(payrollId, contextUser.companyId);
            if (payroll) {
                console.log(`=== PAYROLL UPDATE DEBUG ===`);
                console.log(`Before update:`, {
                    basicSalary: payroll.basicSalary,
                    totalAdditions: payroll.totalAdditions,
                    totalDeductions: payroll.totalDeductions,
                    grossSalary: payroll.grossSalary,
                    netSalary: payroll.netSalary
                });

                // Update payroll totals - use utility functions for safe number operations
                payroll.totalAdditions = totalAdditions;
                payroll.totalDeductions = totalDeductions;
                payroll.grossSalary = safeSum(payroll.basicSalary, totalAdditions);
                // Clamp at 0 so deductions exceeding gross can't store a negative net,
                // matching the generation path (calculateFinalSalary uses Math.max(0, ...)).
                payroll.netSalary = Math.max(0, safeSum(payroll.grossSalary, -totalDeductions));

                console.log(`After update:`, {
                    totalAdditions: payroll.totalAdditions,
                    totalDeductions: payroll.totalDeductions,
                    grossSalary: payroll.grossSalary,
                    netSalary: payroll.netSalary
                });
                console.log(`=== END PAYROLL UPDATE DEBUG ===`);

                await this.payrollRepository.invokeDbOperationsWithResponse(payroll, Actions.Update);
            }
        } catch (error) {
            console.error('Error updating payroll totals:', error);
            // Don't throw error here as it's not critical for the main operation
        }
    }

    /**
     * Get adjustment summary for a payroll
     * @param payrollId - The payroll ID
     * @param contextUser - The user context
     * @returns Summary of adjustments
     */
    async getAdjustmentSummary(payrollId: string, contextUser: ITokenUser): Promise<{
        totalAdjustments: number;
        totalAdditions: number;
        totalDeductions: number;
        adjustmentsByCategory: Record<string, number>;
        adjustmentsByType: Record<string, number>;
    }> {
        try {
            const adjustments = await this.adjustmentRepository.where({
                where: {
                    payrollId: payrollId,
                    companyId: contextUser.companyId
                }
            });

            let totalAdditions = 0;
            let totalDeductions = 0;
            const adjustmentsByCategory: Record<string, number> = {};
            const adjustmentsByType: Record<string, number> = {};

            for (const adjustment of adjustments) {
                if (adjustment.adjustmentType === AdjustmentType.ADDITION) {
                    totalAdditions = safeSum(totalAdditions, adjustment.amount);
                } else {
                    totalDeductions = safeSum(totalDeductions, adjustment.amount);
                }

                // Count by category
                adjustmentsByCategory[adjustment.category] = (adjustmentsByCategory[adjustment.category] || 0) + 1;
                
                // Count by type
                adjustmentsByType[adjustment.adjustmentType] = (adjustmentsByType[adjustment.adjustmentType] || 0) + 1;
            }

            return {
                totalAdjustments: adjustments.length,
                totalAdditions,
                totalDeductions,
                adjustmentsByCategory,
                adjustmentsByType
            };
        } catch (error) {
            throw new AppError(`Error getting adjustment summary: ${error instanceof Error ? error.message : 'Unknown error'}`, '500');
        }
    }
} 