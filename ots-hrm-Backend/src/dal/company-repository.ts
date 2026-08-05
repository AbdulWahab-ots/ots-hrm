import { injectable } from "tsyringe";
import { Company } from "../entities";
import { ICompanyResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class CompanyRepository extends GenericRepository<Company, ICompanyResponse> {
    constructor(){
        super(dataSource.getRepository(Company));
    }

    async existsByName(name: string): Promise<boolean> {
        const count = await this.repository.count({ where: { name } });
        return count > 0;
    }

    // Read-only - for previewing the next Employee Code without consuming a number
    // (so repeatedly loading the Create Employee form never creates gaps).
    async getEmployeeCodeCounter(companyId: string): Promise<number> {
        const company = await this.repository.findOne({
            where: { id: companyId } as any,
            select: ['lastEmployeeCodeNumber'] as any,
        });
        return company?.lastEmployeeCodeNumber ?? 0;
    }

    // Atomically increments and returns the counter via a single UPDATE ... RETURNING -
    // Postgres serializes concurrent updates to the same row via row-level locking, so
    // two employees created at the same instant can never be handed the same number.
    async reserveNextEmployeeCodeNumber(companyId: string): Promise<number> {
        const result = await this.repository
            .createQueryBuilder()
            .update(Company)
            .set({ lastEmployeeCodeNumber: () => '"lastEmployeeCodeNumber" + 1' })
            .where('id = :companyId', { companyId })
            .returning('"lastEmployeeCodeNumber"')
            .execute();
        return result.raw[0].lastEmployeeCodeNumber;
    }

    // Called after an employee is created with an explicitly-provided code (a manual
    // override, or an unmodified auto-suggestion). Moves the counter up to match if the
    // provided number is higher, so a jump-ahead code (e.g. manually typing EMP-050) is
    // correctly reflected in future suggestions - but never moves it backwards.
    async bumpEmployeeCodeCounterIfHigher(companyId: string, num: number): Promise<void> {
        // num is interpolated directly into raw SQL below (GREATEST doesn't take a bound
        // parameter here) - guard against anything but a genuine non-negative integer,
        // since the only caller derives it from a regex-matched numeric string but this
        // is cheap insurance against that ever changing.
        if (!Number.isInteger(num) || num < 0) {
            throw new Error(`bumpEmployeeCodeCounterIfHigher: invalid num ${num}`);
        }
        await this.repository
            .createQueryBuilder()
            .update(Company)
            .set({ lastEmployeeCodeNumber: () => `GREATEST("lastEmployeeCodeNumber", ${num})` })
            .where('id = :companyId', { companyId })
            .execute();
    }

}