import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IAttendanceSummaryRequest, IGetSingleRecordFilter } from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AttendanceSummaryService } from "../bl/attendance-summary-service";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { paramsValidator } from "../middlewares/payload-validator";
import { uuidParamSchema } from "../models/payload-schemas";
import { AppResponse } from "../utility";

@injectable()
export class AttendanceSummaryController extends ControllerBase {
    constructor(
        @inject('AttendanceSummaryService') private readonly attendanceSummaryService: AttendanceSummaryService
    ) {
        super('/attendance-summary');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
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
            }
        ];
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<IAttendanceSummaryRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(
                AppResponse.success(
                    'Attendance summaries fetched successfully',
                    await this.attendanceSummaryService.get(request.user, req.body)
                )
            );
        }
    };

    private getById = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(
                AppResponse.success(
                    'Attendance summary fetched successfully',
                    await this.attendanceSummaryService.getById(req.params.id, request.user)
                )
            );
        }
    };
}
