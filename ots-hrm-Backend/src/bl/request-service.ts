import { inject, injectable } from 'tsyringe';
import { Request } from '../entities';
import { RequestRepository } from '../dal/request-repository';
import { 
    IRequestRequest, 
    IRequestResponse,
    ITokenUser,
    AttendanceRequestType,
    AttendanceRequestStatus,
    AttendanceStatus,
    FilterOperators,
    FilterMatchModes,
    IAttendanceRequest,
} from '../models';
import { AttendanceService } from './attendance-service';
import { AppError } from '../utility/app-error';
import { Service } from './generics/service';
import { PresentStatus } from '../models/enums/attendance.enum';

@injectable()
export class RequestService extends Service<Request, IRequestResponse, IRequestRequest> {
    constructor(
        @inject('RequestRepository') private readonly requestRepository: RequestRepository,
        @inject('AttendanceService') private readonly attendanceService: AttendanceService,
    ) {
        super(requestRepository, () => new Request());
    }

    async add(entityRequest: IRequestRequest, contextUser: ITokenUser): Promise<IRequestResponse> {
        // Generate code if not provided
        if (!entityRequest.code) {
            entityRequest.code = await this.generateRequestCode(contextUser.companyId);
        }

        // Check/create attendance record if not provided
        if (!entityRequest.attendanceId) {
            const attendanceRecord = await this.getOrCreateAttendanceRecord(
                entityRequest.userId, 
                entityRequest.date, 
                contextUser
            );
            entityRequest.attendanceId = attendanceRecord.id!;
        }

        // Validate the request before adding
        await this.validateAttendanceRequest(entityRequest, contextUser);
        
        return await super.add(entityRequest, contextUser);
    }

    async approveRequest(requestId: string, reviewedBy: string, reviewNotes?: string, contextUser?: ITokenUser): Promise<IRequestResponse> {
        const request = await this.getById(requestId, contextUser);
        if (!request) {
            throw new AppError('Request not found', '404');
        }

        if (request.status !== AttendanceRequestStatus.PENDING) {
            throw new AppError('Only pending requests can be approved', '400');
        }

        // Additional validation for check-out requests
        if (request.type === AttendanceRequestType.CHECK_OUT) {
            await this.validateCheckOutForApproval(request, contextUser!);
        }

        // Update the request status
        const requestEntity = new Request();
        requestEntity.reviewRequest(AttendanceRequestStatus.APPROVED, reviewedBy, reviewNotes);
        
        const updatedRequest = await this.update(requestId, requestEntity as any, contextUser!);

        // Update the corresponding attendance record
        await this.updateAttendanceOnApproval(request, contextUser!);

        return updatedRequest;
    }

    async rejectRequest(requestId: string, reviewedBy: string, reviewNotes?: string, contextUser?: ITokenUser): Promise<IRequestResponse> {
        const request = await this.getById(requestId, contextUser);
        if (!request) {
            throw new AppError('Request not found', '404');
        }

        if (request.status !== AttendanceRequestStatus.PENDING) {
            throw new AppError('Only pending requests can be rejected', '400');
        }

        // Update the request entity
        const requestEntity = new Request();
        requestEntity.reviewRequest(AttendanceRequestStatus.REJECTED, reviewedBy, reviewNotes);

        return await this.update(requestId, requestEntity as any, contextUser!);
    }

    private async generateRequestCode(companyId: string): Promise<string> {
        // Get the last request for this company to generate next code
        const lastRequest = await this.requestRepository.getCompanyRecords(companyId, {
            order: { createdAt: 'DESC' },
            take: 1
        });

        let nextNumber = 1;
        if (lastRequest && lastRequest.length > 0) {
            const lastCode = lastRequest[0].code;
            const lastNumber = parseInt(lastCode.split('-').pop() || '0');
            nextNumber = lastNumber + 1;
        }

        return `RE-ATT-${nextNumber.toString().padStart(4, '0')}`;
    }

    private async getOrCreateAttendanceRecord(
        userId: string, 
        date: Date, 
        contextUser: ITokenUser
    ): Promise<any> {
        // First, try to find existing attendance record
        const existingAttendance = await this.attendanceService.getOne(contextUser, {
            filters: [
                { field: 'userId', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'date', value: date, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }
            ]
        });

        if (existingAttendance) {
            return existingAttendance;
        }

        // Create new attendance record with default status
        // The attendance service will automatically handle shift-based working hours
        const newAttendanceRequest = {
            userId: userId,
            date: date,
            status: AttendanceStatus.DEFAULT
        };

        return await this.attendanceService.add(newAttendanceRequest, contextUser);
    }

    private async validateAttendanceRequest(request: IRequestRequest, contextUser: ITokenUser): Promise<void> {
        const { userId, type, date, attendanceId } = request;

        // Get the attendance record
        const attendanceRecord = await this.attendanceService.getById(attendanceId!, contextUser);
        if (!attendanceRecord) {
            throw new AppError('Attendance record not found', '404');
        }

        // Check if there's already a pending request for the same type and date
        const existingRequest = await this.getOne(contextUser, {
            filters: [
                { field: 'userId', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'type', value: type, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'date', value: date, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'status', value: AttendanceRequestStatus.PENDING, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }
            ]
        });

        if (existingRequest) {
            throw new AppError(`A ${type.toLowerCase()} request for this date is already pending`, '400');
        }

        if (type === AttendanceRequestType.CHECK_IN) {
            await this.validateCheckInRequest(attendanceRecord, userId, date, contextUser);
        } else if (type === AttendanceRequestType.CHECK_OUT) {
            await this.validateCheckOutRequest(attendanceRecord, userId, date, contextUser);
        }
    }

    private async validateCheckInRequest(attendanceRecord: any, userId: string, date: Date, contextUser: ITokenUser): Promise<void> {
        // If attendance already has both check-in and check-out, reject the request
        if (attendanceRecord.checkInTime && attendanceRecord.checkOutTime) {
            throw new AppError('Attendance already marked complete', '400');
        }

        // If status is "present" or already has a check-in, reject the request
        if (attendanceRecord.status === AttendanceStatus.PRESENT || attendanceRecord.checkInTime) {
            throw new AppError('User already checked in', '400');
        }

        // Check if there's already an approved check-in request
        const approvedCheckInRequest = await this.getOne(contextUser, {
            filters: [
                { field: 'userId', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'type', value: AttendanceRequestType.CHECK_IN, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'date', value: date, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'status', value: AttendanceRequestStatus.APPROVED, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }
            ]
        });

        if (approvedCheckInRequest) {
            throw new AppError('Check-in request has already been approved for this date', '400');
        }

        // If status is "default" and check-in is missing, allow the request
        if (attendanceRecord.status === AttendanceStatus.DEFAULT && !attendanceRecord.checkInTime) {
            // This is valid, request can proceed
            return;
        }

        // If we reach here, something is not right
        throw new AppError('Check-in request cannot be processed under current attendance status', '400');
    }

    private async validateCheckOutRequest(attendanceRecord: any, userId: string, date: Date, contextUser: ITokenUser): Promise<void> {
        // If status is "present" and check-out exists, reject the request
        if (attendanceRecord.status === AttendanceStatus.PRESENT && attendanceRecord.checkOutTime) {
            throw new AppError('User already checked out', '400');
        }

        // Check if user has already physically checked in (direct check-in without request)
        const hasPhysicalCheckIn = attendanceRecord.status === AttendanceStatus.PRESENT && 
                                   attendanceRecord.presentStatus === PresentStatus.CHECK_IN;

        if (hasPhysicalCheckIn) {
            // User has already checked in directly, allow check-out request
            // Check if there's already an approved check-out request
            const approvedCheckOutRequest = await this.getOne(contextUser, {
                filters: [
                    { field: 'userId', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                    { field: 'type', value: AttendanceRequestType.CHECK_OUT, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                    { field: 'date', value: date, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                    { field: 'status', value: AttendanceRequestStatus.APPROVED, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }
                ]
            });

            if (approvedCheckOutRequest) {
                throw new AppError('Check-out request has already been approved for this date', '400');
            }

            return; // Allow check-out request for users who have physically checked in
        }

        // For users who haven't physically checked in, check for check-in requests
        let hasCheckInRequest = false;
        
        // Check for any check-in request (PENDING or APPROVED)
        const checkInRequest = await this.getOne(contextUser, {
            filters: [
                { field: 'userId', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'type', value: AttendanceRequestType.CHECK_IN, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'date', value: date, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }
            ]
        });

        if (checkInRequest && (checkInRequest.status === AttendanceRequestStatus.PENDING || checkInRequest.status === AttendanceRequestStatus.APPROVED)) {
            hasCheckInRequest = true;
        }

        if (!hasCheckInRequest) {
            throw new AppError('Check-in request must exist before check-out request can be submitted (unless already physically checked in)', '400');
        }

        // Check if there's already an approved check-out request
        const approvedCheckOutRequest = await this.getOne(contextUser, {
            filters: [
                { field: 'userId', value: userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'type', value: AttendanceRequestType.CHECK_OUT, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'date', value: date, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                { field: 'status', value: AttendanceRequestStatus.APPROVED, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }
            ]
        });

        if (approvedCheckOutRequest) {
            throw new AppError('Check-out request has already been approved for this date', '400');
        }

        // Allow check-out request creation if check-in request exists
        return;
    }

    private async validateCheckOutForApproval(request: IRequestResponse, contextUser: ITokenUser): Promise<void> {
        // Get the attendance record
        const attendanceRecord = await this.attendanceService.getById(request.attendanceId, contextUser);
        if (!attendanceRecord) {
            throw new AppError('Attendance record not found', '404');
        }

        // Check if user has physically checked in (status = PRESENT and presentStatus = CHECK_IN)
        const hasPhysicalCheckIn = attendanceRecord.status === AttendanceStatus.PRESENT && 
                                   attendanceRecord.presentStatus === PresentStatus.CHECK_IN;

        if (hasPhysicalCheckIn) {
            // User has already checked in directly, allow check-out approval
            return;
        }

        // For users who haven't physically checked in, check for approved check-in request
        let hasApprovedCheckIn = attendanceRecord.checkInTime || attendanceRecord.status === AttendanceStatus.PRESENT;

        if (!hasApprovedCheckIn) {
            // Check for approved check-in request
            const approvedCheckInRequest = await this.getOne(contextUser, {
                filters: [
                    { field: 'userId', value: request.userId, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                    { field: 'type', value: AttendanceRequestType.CHECK_IN, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                    { field: 'date', value: request.date, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal },
                    { field: 'status', value: AttendanceRequestStatus.APPROVED, operator: FilterOperators.And, matchMode: FilterMatchModes.Equal }
                ]
            });

            if (!approvedCheckInRequest) {
                throw new AppError('Check-in must be present (either through attendance or approved request) before approving check-out', '400');
            }
        }
    }

    private async updateAttendanceOnApproval(request: IRequestResponse, contextUser: ITokenUser): Promise<void> {
        // Get the attendance record
        const attendanceRecord = await this.attendanceService.getById(request.attendanceId, contextUser);
        if (!attendanceRecord) {
            throw new AppError('Attendance record not found', '404');
        }

        if (request.type === AttendanceRequestType.CHECK_IN) {
            // For CHECK_IN requests, implement the same functionality as attendance service checkIn
            await this.handleCheckInApproval(request, attendanceRecord, contextUser);
        } else if (request.type === AttendanceRequestType.CHECK_OUT) {
            // For CHECK_OUT requests, use the existing attendance service checkOut method
            await this.handleCheckOutApproval(request, attendanceRecord, contextUser);
        }
    }

    private async handleCheckInApproval(request: IRequestResponse, attendanceRecord: any, contextUser: ITokenUser): Promise<void> {
        // Create a mock contextUser with the request user's ID for the checkIn method
        const mockContextUser = {
            ...contextUser,
            id: request.userId
        };

        // Call the attendance service's checkIn method
        await this.attendanceService.checkIn(mockContextUser, {
            date: request.date,
            checkInTime: request.time
        });
    }

    private async handleCheckOutApproval(request: IRequestResponse, attendanceRecord: any, contextUser: ITokenUser): Promise<void> {
        // Create a mock contextUser with the request user's ID for the checkOut method
        const mockContextUser = {
            ...contextUser,
            id: request.userId
        };

        // Call the attendance service's checkOut method
        await this.attendanceService.checkOut(mockContextUser, {
            date: request.date,
            checkOutTime: request.time
        });
    }
}
