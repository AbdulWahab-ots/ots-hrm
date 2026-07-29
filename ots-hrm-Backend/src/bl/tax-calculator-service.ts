import { injectable } from "tsyringe";
import { PAKISTAN_TAX_SLABS } from "../constants/tax-slabs";
import { AppError } from "../utility/app-error";

export interface ITaxCalculationRequest {
    salary: number;
    period: 'monthly' | 'annually';
}

export interface ITaxCalculationResponse {
    salary: number;
    period: 'monthly' | 'annually';
    annualTaxableIncome: number;
    annualTax: number;
    monthlyTax: number;
    appliedSlab: {
        minAmount: number;
        maxAmount?: number;
        rate: number;
        fixedAmount: number;
        description: string;
    };
}

@injectable()
export class TaxCalculatorService {
    
    /**
     * Calculate tax based on salary and period
     * @param salary - Salary amount
     * @param period - 'monthly' or 'annually'
     * @returns Tax calculation result
     */
    public calculateTax(salary: number, period: 'monthly' | 'annually'): ITaxCalculationResponse {
        if (salary <= 0) {
            throw new AppError('Salary must be a positive number', '400');
        }

        // Convert to annual income
        const annualTaxableIncome = period === 'monthly' ? salary * 12 : salary;

        // Find applicable tax slab
        const applicableSlab = PAKISTAN_TAX_SLABS.find(slab => 
            annualTaxableIncome >= slab.minAmount && 
            (!slab.maxAmount || annualTaxableIncome <= slab.maxAmount)
        );

        if (!applicableSlab) {
            throw new AppError('No applicable tax slab found', '400');
        }

        // Calculate annual tax
        let annualTax = applicableSlab.fixedAmount;
        if (applicableSlab.rate > 0) {
            const excessAmount = annualTaxableIncome - applicableSlab.minAmount;
            annualTax += (excessAmount * applicableSlab.rate) / 100;
        }

        // Calculate surcharge (9% on tax if annual income exceeds Rs 10 million)
        const surcharge = annualTaxableIncome > 10000000 ? (annualTax * 9) / 100 : 0;
        const totalAnnualTax = annualTax + surcharge;

        return {
            salary,
            period,
            annualTaxableIncome,
            annualTax: Math.round(totalAnnualTax),
            monthlyTax: Math.round(totalAnnualTax / 12),
            appliedSlab: applicableSlab
        };
    }

    /**
     * Get tax slabs
     * @returns Array of tax slabs
     */
    public getTaxSlabs() {
        return PAKISTAN_TAX_SLABS;
    }
} 