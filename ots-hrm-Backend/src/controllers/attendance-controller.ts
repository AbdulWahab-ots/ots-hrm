import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IFilter, IAttendanceRequest, IAttendanceResponse, IAttendanceStatusResponse, IGetSingleRecordFilter, ICheckOutRequest, ICheckInRequest, IStatusRequest, IStartBreakRequest, IEndBreakRequest, IBiometricSyncRequest, IBiometricBulkSyncRequest } from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AttendanceService } from "../bl";
import { AttendanceBreakService } from "../bl/attendance-break-service";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { requireAdminAccess } from "../middlewares/permissions";
import { payloadValidator, bodyValidator, queryValidator, paramsValidator } from "../middlewares/payload-validator";
import { uuidParamSchema, checkInSchema, checkOutSchema, statusSchema, startBreakSchema, endBreakSchema, biometricSyncSchema, biometricBulkSyncSchema } from "../models/payload-schemas";
import { AppResponse } from "../utility";


@injectable()
export class AttendanceController extends ControllerBase {
    constructor(
        @inject('AttendanceService') private readonly attendanceService: AttendanceService,
        @inject('AttendanceBreakService') private readonly attendanceBreakService: AttendanceBreakService
    ){
        super('/attendance');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'GET',
                path: 'status',
                middlewares: [queryValidator(statusSchema)],
                handler: this.status as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'check-in',
                middlewares: [bodyValidator(checkInSchema)],
                handler: this.checkIn as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'check-out',
                middlewares: [bodyValidator(checkOutSchema)],
                handler: this.checkOut as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'stats',
                handler: this.stats as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.getAll,
                handler: this.getAll as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: `${CommonRoutes.getById}/:id`,
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.getById as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.getOneByQuery,
                handler: this.getOneByQuery as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'break/start',
                middlewares: [bodyValidator(startBreakSchema)],
                handler: this.startBreak as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'break/end',
                middlewares: [bodyValidator(endBreakSchema)],
                handler: this.endBreak as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'reminders',
                middlewares: [requireAdminAccess()],
                handler: this.reminders as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'reminders/send',
                middlewares: [requireAdminAccess()],
                handler: this.sendReminders as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'biometric-sync',
                middlewares: [bodyValidator(biometricSyncSchema)],
                handler: this.biometricSync as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'biometric-sync-all',
                middlewares: [requireAdminAccess(), bodyValidator(biometricBulkSyncSchema)],
                handler: this.biometricSyncAll as RouteHandlerMethod
            }
        ];

    }

    // Admin: today's pending check-in/out reminders for the company.
    private reminders = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Check-in/out reminders fetched successfully",
                    await this.attendanceService.getPendingReminders(request.user)
                )
            );
        }
    }

    // Admin: deliver reminder notifications (optionally to specific userIds).
    private sendReminders = async (req: FastifyRequest<{Body?: {userIds?: string[]}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Reminders sent successfully",
                    await this.attendanceService.sendReminders(request.user, req.body?.userIds)
                )
            );
        }
    }

    // Refresh an employee's attendance from the biometric device middleware — employeeId
    // omitted resolves to the caller's own record (employee dashboard); an admin may pass
    // employeeId to refresh anyone in their company (see AttendanceService for the guard).
    private biometricSync = async (req: FastifyRequest<{Body: IBiometricSyncRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Attendance refreshed successfully",
                    await this.attendanceService.syncFromBiometricDevice(request.user, req.body ?? {})
                )
            );
        }
    }

    // Admin-only: sync every active employee in the company from the biometric device
    // for one date (default today). Each employee is attempted independently.
    private biometricSyncAll = async (req: FastifyRequest<{Body?: IBiometricBulkSyncRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Attendance sync completed",
                    await this.attendanceService.syncAllEmployeesFromBiometricDevice(request.user, req.body ?? {})
                )
            );
        }
    }

    private status = async (req: FastifyRequest<{Querystring: IStatusRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Attendance status fetched successfully",
                    await this.attendanceService.status(request.user, req.query),
                )
            );
        }
    }

    private checkIn = async (req: FastifyRequest<{Body: ICheckInRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Check-in successful",
                    await this.attendanceService.checkIn(request.user, req.body)
                )
            );
        }
    }

    private checkOut = async (req: FastifyRequest<{Body: ICheckOutRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Check-out successful",
                    await this.attendanceService.checkOut(request.user, req.body)
                )
            );
        }
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IAttendanceRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    "Attendance records fetched successfully",
                    await this.attendanceService.get(request.user, req.body)
                )
            );
        }
    }

    private stats = async (req: FastifyRequest<{Body?: IFetchRequest<IAttendanceRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Attendance stats fetched successfully",
                    await this.attendanceService.getStats(request.user, req.body ?? {})
                )
            );
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        res.send(
            AppResponse.success(
                "Attendance record fetched successfully",
                await this.attendanceService.getById(req.params.id, request.user)
            )
        );
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IAttendanceRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Attendance record fetched successfully",
                    await this.attendanceService.getOne(request.user, req.body)
                )
            );
        }
    }

    private startBreak = async (req: FastifyRequest<{Body: IStartBreakRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Break started successfully",
                    await this.attendanceBreakService.startBreak(request.user, req.body)
                )
            );
        }
    }

    private endBreak = async (req: FastifyRequest<{Body: IEndBreakRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Break ended successfully",
                    await this.attendanceBreakService.endBreak(request.user, req.body)
                )
            );
        }
    }
}
