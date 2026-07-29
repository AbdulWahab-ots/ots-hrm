import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { IFetchRequest, IFilter, IGetSingleRecordFilter, ILeaveTypeRequest, ILeaveTypeResponse } from "../models";
import { LeaveTypeService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { bodyValidator, queryValidator, paramsValidator } from "../middlewares/payload-validator";
import { createLeaveTypeSchema, updateLeaveTypeSchema,  uuidParamSchema, } from "../models/payload-schemas";
import { AppResponse } from "../utility";


@injectable()
export class LeaveTypeController extends ControllerBase {
    constructor(@inject('LeaveTypeService') private readonly leaveTypeService: LeaveTypeService){
        super('/leave-type');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(createLeaveTypeSchema)],
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
                    bodyValidator(updateLeaveTypeSchema)
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


    private add = async (req: FastifyRequest<{Body: ILeaveTypeRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    'Leave type created successfully',
                    await this.leaveTypeService.add(req.body, request.user)
                )
            )
        }
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<ILeaveTypeRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(AppResponse.success(
                'Leave types fetched successfully',
                await this.leaveTypeService.get(request.user, req.body)
            ))
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(AppResponse.success(
                'Leave type fetched successfully',
                await this.leaveTypeService.getById(req.params.id, request.user)
            ))
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<ILeaveTypeRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Leave type fetched successfully',
              await this.leaveTypeService.getOne(request.user, req.body)
          ));
        }
    }
 
    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Leave type deleted successfully',
              await this.leaveTypeService.delete(req.params.id, request.user)
          ));
        }
    }

    private update = async (req: FastifyRequest<{Body: ILeaveTypeRequest, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Leave type updated successfully',
              await this.leaveTypeService.update(req.params.id, req.body, request.user)
          ));
        }   
    }

}