import { injectable } from "tsyringe";
import { Invite } from "../entities";
import { IInviteResponse, InviteStatus } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class InviteRepository extends GenericRepository<Invite, IInviteResponse> {
    constructor() {
        super(dataSource.getRepository(Invite));
    }

    async findByToken(token: string): Promise<Invite | null> {
        return await this.repository.findOne({
            where: { token, active: true, deleted: false },
            relations: ['company']
        });
    }

    async findByEmail(email: string, companyId?: string): Promise<Invite | null> {
        const whereCondition: any = { 
            email, 
            active: true, 
            deleted: false 
        };
        
        if (companyId) {
            whereCondition.companyId = companyId;
        }

        return await this.repository.findOne({
            where: whereCondition,
            relations: ['company']
        });
    }

    async findValidInviteByToken(token: string): Promise<Invite | null> {
        return await this.repository.findOne({
            where: { 
                token, 
                status: InviteStatus.PENDING,
                active: true, 
                deleted: false 
            },
            relations: ['company']
        });
    }

    async findPendingInvitesByCompany(companyId: string): Promise<Invite[]> {
        return await this.repository.find({
            where: { 
                companyId,
                status: InviteStatus.PENDING,
                active: true, 
                deleted: false 
            },
            relations: ['company'],
            order: { createdAt: 'DESC' }
        });
    }

    async markExpiredInvites(): Promise<void> {
        await this.repository
            .createQueryBuilder()
            .update(Invite)
            .set({ status: InviteStatus.EXPIRED })
            .where('status = :status', { status: InviteStatus.PENDING })
            .andWhere('expiresAt < :now', { now: new Date() })
            .andWhere('active = :active', { active: true })
            .andWhere('deleted = :deleted', { deleted: false })
            .execute();
    }
}
