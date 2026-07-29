import { inject, injectable } from "tsyringe";
import { QueryRunner } from "typeorm";
import { UserShiftRepository } from "../dal";
import { UserShift } from "../entities";
import { IUserShiftRequest, IUserShiftResponse, IAssignShiftRequest, ITokenUser, Actions, FilterOperators, FilterMatchModes } from "../models";
import { Service } from "./generics/service";
import { AppError } from "../utility/app-error";

@injectable()
export class UserShiftService extends Service<UserShift, IUserShiftResponse, IUserShiftRequest> {
    constructor(@inject('UserShiftRepository') private readonly userShiftRepository: UserShiftRepository) {
        super(userShiftRepository, () => new UserShift())
    }

    /**
     * Assigns or updates a user's shift assignment with automatic date setting
     * @param request - The shift assignment request containing userId and shiftId
     * @param contextUser - The current user context
     * @returns Promise<IUserShiftResponse | null> - Returns the new assignment or null if no action was needed
     */
    async assignOrUpdateUserShift(request: IAssignShiftRequest, contextUser: ITokenUser, queryRunner?: QueryRunner): Promise<IUserShiftResponse | null> {
        if (!request.userId || !request.shiftId) {
            throw new AppError('User ID and Shift ID are required', '400');
        }

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // When a caller (e.g. employee onboarding) passes its own queryRunner we join that
        // transaction and let the caller own the commit/rollback. Otherwise we own a local one.
        const isExternalTransaction = !!queryRunner;
        const txRunner = queryRunner ?? await this.userShiftRepository.beginTransaction();

        try {
            const activeShift = await this.findActiveShift(request.userId, contextUser.companyId);

            if (activeShift && activeShift.shiftId === request.shiftId) {
                if (!isExternalTransaction) {
                    await this.userShiftRepository.rollbackTransaction(txRunner);
                }
                return null;
            }

            if (activeShift && activeShift.shiftId !== request.shiftId) {
                await this.endActiveShift(activeShift, currentDate, contextUser, txRunner);
            }

            const createdShift = await this.createNewShiftAssignment(request.userId, request.shiftId, currentDate, contextUser, txRunner);

            if (!isExternalTransaction) {
                await this.userShiftRepository.commitTransaction(txRunner);
            }

            return createdShift.toResponse();

        } catch (error) {
            if (!isExternalTransaction) {
                await this.userShiftRepository.rollbackTransaction(txRunner);
            }
            throw error;
        }
    }

    /**
     * Private helper method to find active shift for a user
     */
    private async findActiveShift(userId: string, companyId: string): Promise<UserShift | null> {
        return await this.userShiftRepository.firstOrDefault({
            where:{
                userId: userId,
                companyId: companyId,
                active: true,
                effectiveTo: undefined
            },
            relations: { user: true, shift: true }
        });
    }

    /**
     * Private helper method to end an active shift
     */
    private async endActiveShift(activeShift: UserShift, currentDate: Date, contextUser: ITokenUser, queryRunner?: QueryRunner): Promise<void> {
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);

        activeShift.effectiveTo = yesterday;
        activeShift.active = false;
        activeShift.modifiedAt = new Date();
        activeShift.modifiedById = contextUser.id;
        activeShift.modifiedBy = contextUser.name;

        await this.userShiftRepository.invokeDbOperations(activeShift, Actions.Update, queryRunner);
    }

    /**
     * Private helper method to create a new shift assignment
     */
    private async createNewShiftAssignment(userId: string, shiftId: string, effectiveFrom: Date, contextUser: ITokenUser, queryRunner?: QueryRunner): Promise<UserShift> {
        const newUserShiftRequest: IUserShiftRequest = {
            userId: userId,
            shiftId: shiftId,
            effectiveFrom: effectiveFrom,
            effectiveTo: undefined
        };

        const newUserShift = new UserShift().toEntity(newUserShiftRequest, undefined, contextUser);
        return await this.userShiftRepository.invokeDbOperations(newUserShift, Actions.Add, queryRunner);
    }

    /**
     * Gets the current active shift for a user
     * @param userId - The ID of the user
     * @param contextUser - The current user context
     * @returns Promise<IUserShiftResponse | null> - Returns the active shift or null if none exists
     */
    async getCurrentActiveShift(userId: string, contextUser: ITokenUser): Promise<IUserShiftResponse | null> {
        if (!userId) {
            throw new AppError('User ID is required', '400');
        }

        const activeShift = await this.findActiveShift(userId, contextUser.companyId);
        return activeShift ? activeShift.toResponse() : null;
    }

}
