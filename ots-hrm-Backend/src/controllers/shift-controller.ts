import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IFilter, IShiftRequest, IShiftResponse, IGetSingleRecordFilter } from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { ShiftService } from "../bl";
import { AppResponse } from "../utility";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { payloadValidator, bodyValidator, queryValidator, paramsValidator } from "../middlewares/payload-validator";
import { uuidParamSchema, createShiftSchema, updateShiftSchema } from "../models/payload-schemas";


@injectable()
export class ShiftController extends ControllerBase {
    constructor(
        @inject('ShiftService') private readonly shiftService: ShiftService
    ) {
        super('/shift');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(createShiftSchema)],
                handler: this.add as RouteHandlerMethod
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
                method: 'PUT',
                path: `${CommonRoutes.update}/:id`,
                middlewares: [
                    paramsValidator(uuidParamSchema),
                    bodyValidator(updateShiftSchema)
                ],
                handler: this.update as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.delete as RouteHandlerMethod
            }
        ];

    }


    private add = async (req: FastifyRequest<{ Body: IShiftRequest }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Shift created successfully',
                await this.shiftService.add(req.body, request.user)
            ))
        }
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<IShiftRequest> }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if (request.user) {

            res.send(AppResponse.success(
                'Shifts retrieved successfully',
                await this.shiftService.get(request.user, req.body)
            ));
        }
    }

    private getById = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if (request.user) {

            res.send(AppResponse.success(
                'Shift retrieved successfully',
                await this.shiftService.getById(req.params.id, request.user)
            ));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{ Body: IGetSingleRecordFilter<IShiftRequest> }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Shift retrieved successfully',
                await this.shiftService.getOne(request.user, req.body)
            ));
        }
    }

    private delete = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Shift deleted successfully',
                await this.shiftService.delete(req.params.id, request.user)
            ));
        }
    }

    private update = async (req: FastifyRequest<{ Body: IShiftRequest, Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Shift updated successfully',
                await this.shiftService.update(req.params.id, req.body, request.user)
            ));
        }
    }

}