import { inject, injectable } from "tsyringe";
import { BenefitRepository, DepartmentRepository, EmployeeBenefitRepository } from "../dal";
import { Benefit } from "../entities";
import { IBenefitRequest, IBenefitResponse, ITokenUser, BenefitType, BenefitValueType, BenefitFrequency } from "../models";
import { Service } from "./generics/service";
import { generateCodeFromName, sanitizeString } from "../utility";
import { AppError } from "../utility/app-error";
import { Not, IsNull } from "typeorm";

@injectable()
export class BenefitService extends Service<Benefit, IBenefitResponse, IBenefitRequest> {
    constructor(
        @inject('BenefitRepository') private readonly benefitRepository: BenefitRepository,
        @inject('DepartmentRepository') private readonly departmentRepository: DepartmentRepository,
        @inject('EmployeeBenefitRepository') private readonly employeeBenefitRepository: EmployeeBenefitRepository,
    ) {
        super(benefitRepository, () => new Benefit());
    }

    async add(request: IBenefitRequest, contextUser: ITokenUser): Promise<IBenefitResponse> {
        // Validate department exists if departmentId is provided
        if (request.departmentId) {
            const department = await this.departmentRepository.firstOrDefault({
                where: { id: request.departmentId, companyId: contextUser.companyId }
            });
            
            if (!department) {
                throw new AppError("Department not found", '404');
            }
        }

        // Generate code if not provided
        let code = request.code;
        if (!code && request.name) {
            const sanitizedName = sanitizeString(request.name);
            code = generateCodeFromName(sanitizedName);
        }

        // Check if name or code already exists within the same company-department combination
        if (code || request.name) {
            const whereConditions = [];
            
            if (request.name) {
                whereConditions.push({
                    name: sanitizeString(request.name),
                    companyId: contextUser.companyId,
                    departmentId: request.departmentId || IsNull(),
                    deleted: false
                });
            }

            if (code) {
                whereConditions.push({
                    code: code,
                    companyId: contextUser.companyId,
                    departmentId: request.departmentId || IsNull(),
                    deleted: false
                });
            }

            const existing = await this.benefitRepository.firstOrDefault({
                where: whereConditions
            });

            if (existing) {
                const scope = request.departmentId ? 'department' : 'company';
                throw new AppError(`Benefit with name/code '${request.name || code}' already exists in this ${scope}.`, '409');
            }
        }

        // Validate benefit type
        if (!Object.values(BenefitType).includes(request.type)) {
            throw new AppError("Invalid benefit type", '400');
        }

        // Validate value type if provided
        if (request.valueType && !Object.values(BenefitValueType).includes(request.valueType)) {
            throw new AppError("Invalid value type", '400');
        }

        // Validate frequency if provided
        if (request.frequency && !Object.values(BenefitFrequency).includes(request.frequency)) {
            throw new AppError("Invalid frequency", '400');
        }

        return await super.add(request, contextUser);
    }

    async update(id: string, request: IBenefitRequest, contextUser: ITokenUser): Promise<IBenefitResponse> {
        let { name, ...benefitData } = request;
        name = sanitizeString(name);
        const generatedCode = generateCodeFromName(name);
        const code = request.code || generatedCode;

        // Check if name or code already exists for another benefit within the same company-department combination
        const whereConditions = [];
        
        if (name) {
            whereConditions.push({
                name: name,
                id: Not(id),
                companyId: contextUser.companyId,
                departmentId: request.departmentId || IsNull(),
                deleted: false
            });
        }

        if (code) {
            whereConditions.push({
                code: code,
                id: Not(id),
                companyId: contextUser.companyId,
                departmentId: request.departmentId || IsNull(),
                deleted: false
            });
        }

        const existing = await this.benefitRepository.firstOrDefault({
            where: whereConditions
        });

        if (existing) {
            const scope = request.departmentId ? 'department' : 'company';
            throw new AppError(`Benefit with name/code '${name || code}' already exists in this ${scope}.`, '409');
        }

        // Validate department exists if departmentId is provided
        if (request.departmentId) {
            const department = await this.departmentRepository.firstOrDefault({
                where: { id: request.departmentId, companyId: contextUser.companyId }
            });
            
            if (!department) {
                throw new AppError("Department not found", '404');
            }
        }

        // Validate benefit type
        if (!Object.values(BenefitType).includes(request.type)) {
            throw new AppError("Invalid benefit type", '400');
        }

        // Validate value type if provided
        if (request.valueType && !Object.values(BenefitValueType).includes(request.valueType)) {
            throw new AppError("Invalid value type", '400');
        }

        // Validate frequency if provided
        if (request.frequency && !Object.values(BenefitFrequency).includes(request.frequency)) {
            throw new AppError("Invalid frequency", '400');
        }

        const updateRequest = { name, code, ...benefitData };
        return await super.update(id, updateRequest, contextUser);
    }

    async getBenefitsByDepartment(departmentId: string, contextUser: ITokenUser): Promise<IBenefitResponse[]> {
        const benefits = await this.benefitRepository.where({
            where: [
                { departmentId: departmentId, companyId: contextUser.companyId, active: true },
                { departmentId: IsNull(), companyId: contextUser.companyId, active: true } // Company-wide benefits
            ],
            relations: ['department'],
            order: { sortOrder: 'ASC', name: 'ASC' }
        });

        return benefits.map((benefit: Benefit) => benefit.toResponse());
    }

    async getCompanyWideBenefits(contextUser: ITokenUser): Promise<IBenefitResponse[]> {
        const benefits = await this.benefitRepository.where({
            where: { 
                departmentId: IsNull(), 
                companyId: contextUser.companyId, 
                active: true 
            },
            order: { sortOrder: 'ASC', name: 'ASC' }
        });

        return benefits.map((benefit: Benefit) => benefit.toResponse());
    }

    /** Counts employees who currently have this benefit assigned. */
    public async getDependencyCounts(id: string, contextUser: ITokenUser): Promise<{ employees: number }> {
        const employees = await this.employeeBenefitRepository.entityCount({ benefitId: id, companyId: contextUser.companyId, deleted: false } as any);
        return { employees };
    }

    public async delete(id: string, contextUser: ITokenUser): Promise<void> {
        const { employees } = await this.getDependencyCounts(id, contextUser);

        if (employees > 0) {
            throw new AppError(
                `Cannot delete this benefit because ${employees} employee(s) still have it assigned. Please remove it from those employees first.`,
                '409'
            );
        }

        await this.benefitRepository.partialUpdate(id, { deleted: true, active: false } as any, contextUser, undefined, ['active', 'deleted']);
    }

}
