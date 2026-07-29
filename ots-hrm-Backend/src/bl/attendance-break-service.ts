import { inject, injectable } from "tsyringe";
import { AttendanceBreakRepository, AttendanceRepository } from "../dal";
import { AttendanceBreak } from "../entities";
import { Actions, IBreakRequest, IBreakResponse, IEndBreakRequest, IStartBreakRequest, ITokenUser, PresentStatus } from "../models";
import { Service } from "./generics/service";
import { AppError } from "../utility/app-error";

@injectable()
export class AttendanceBreakService extends Service<AttendanceBreak, IBreakResponse, IBreakRequest> {
    constructor(
        @inject('AttendanceBreakRepository') private readonly attendanceBreakRepository: AttendanceBreakRepository,
        @inject('AttendanceRepository') private readonly attendanceRepository: AttendanceRepository
    ) {
        super(attendanceBreakRepository, () => new AttendanceBreak())
    }

    public async startBreak(contextUser: ITokenUser, request: IStartBreakRequest): Promise<IBreakResponse> {
        // Fetch today's attendance record with breaks
        const attendance = await this.attendanceRepository.firstOrDefault({
            where: { id: request.attendanceId, userId: contextUser.id },
            relations: { breaks: true }
        });

        if (!attendance) {
            throw new AppError('Attendance record not found.', '404');
        }

        if (attendance.presentStatus !== PresentStatus.CHECK_IN) {
            throw new AppError('You must be checked in to start a break.', '400');
        }

        const ongoingBreak = attendance.getCurrentBreak();
        if (ongoingBreak) {
            throw new AppError('You already have an ongoing break. Please end it first.', '400');
        }

        // Create break entity
        const breakEntity = new AttendanceBreak().toEntity(
            {
                attendanceId: request.attendanceId,
                userId: contextUser.id!,
                breakType: request.breakType,
                startTime: new Date(),
                notes: request.notes,
            },
            undefined,
            contextUser
        );
        breakEntity.isActive = true;

        const savedBreak = await this.attendanceBreakRepository.invokeDbOperations(breakEntity, Actions.Add);

        // Update attendance presentStatus to ON_BREAK
        await this.attendanceRepository.partialUpdate(
            attendance.id,
            { presentStatus: PresentStatus.ON_BREAK },
            contextUser
        );

        return savedBreak.toResponse();
    }

    public async endBreak(contextUser: ITokenUser, request: IEndBreakRequest): Promise<IBreakResponse> {
        // Fetch break with attendance relation
        const breakRecord = await this.attendanceBreakRepository.firstOrDefault({
            where: { id: request.breakId, userId: contextUser.id },
            relations: { attendance: { breaks: true } }
        });

        if (!breakRecord) {
            throw new AppError('Break record not found.', '404');
        }

        if (!breakRecord.isActive) {
            throw new AppError('This break has already ended.', '400');
        }

        // End the break
        breakRecord.endBreak();

        const updatedBreak = await this.attendanceBreakRepository.partialUpdate(
            breakRecord.id,
            {
                endTime: breakRecord.endTime,
                durationMinutes: breakRecord.durationMinutes,
                isActive: false,
            },
            contextUser
        );

        // Recalculate total break time on attendance
        const attendance = breakRecord.attendance;
        if (attendance) {
            // Reload breaks to include the just-ended break
            const allBreaks = attendance.breaks || [];
            const updatedBreaks = allBreaks.map(b => b.id === breakRecord.id ? breakRecord : b);
            attendance.breaks = updatedBreaks;
            const totalBreakTime = attendance.calculateTotalBreakTime();

            await this.attendanceRepository.partialUpdate(
                attendance.id,
                {
                    totalBreakTime,
                    presentStatus: PresentStatus.CHECK_IN,
                },
                contextUser
            );
        }

        return updatedBreak.toResponse();
    }
}
