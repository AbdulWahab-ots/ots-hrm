import { inject, injectable } from "tsyringe";
import { QueryRunner } from "typeorm";
import { EmployeeBenefitRepository, BenefitRepository, EmployeeRepository } from "../dal";
import { EmployeeBenefit } from "../entities";
import { Actions, IEmployeeBenefitRequest, IEmployeeBenefitResponse, ITokenUser, EmployeeBenefitStatus } from "../models";
import { Service } from "./generics/service";
import { AppError } from "../utility/app-error";

@injectable()
export class EmployeeBenefitService extends Service<EmployeeBenefit, IEmployeeBenefitResponse, IEmployeeBenefitRequest> {
    constructor(
        @inject('EmployeeBenefitRepository') private readonly employeeBenefitRepository: EmployeeBenefitRepository
    ) {
        super(employeeBenefitRepository, () => new EmployeeBenefit());
    }

    // Benefits attached to a user, with the fields needed to replace them on update.
    async getBenefitsByUser(userId: string): Promise<EmployeeBenefit[]> {
        return this.employeeBenefitRepository.where({
            where: { userId },
            select: ['id', 'userId', 'employeeId', 'benefitId', 'effectiveDate']
        });
    }

    // Persists a benefit, optionally joining a caller-owned transaction.
    async addBenefit(benefit: EmployeeBenefit, queryRunner?: QueryRunner): Promise<EmployeeBenefit> {
        return this.employeeBenefitRepository.invokeDbOperations(benefit, Actions.Add, queryRunner);
    }

    // Removes a benefit, optionally joining a caller-owned transaction.
    async deleteBenefit(benefit: EmployeeBenefit, queryRunner?: QueryRunner): Promise<EmployeeBenefit> {
        return this.employeeBenefitRepository.invokeDbOperations(benefit, Actions.Delete, queryRunner);
    }
}