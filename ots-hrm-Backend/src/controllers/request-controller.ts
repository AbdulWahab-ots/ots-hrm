import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IRequestRequest, IRequestResponse, IGetSingleRecordFilter } from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { RequestService } from "../bl/request-service";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { bodyValidator, paramsValidator, queryValidator } from "../middlewares/payload-validator";
import { uuidParamSchema, requestCreateSchema, requestUpdateSchema, requestReviewSchema } from "../models/payload-schemas";
import { AppResponse } from "../utility";

@injectable()
export class RequestController extends ControllerBase {
    constructor(
        @inject('RequestService') private readonly requestService: RequestService
    ){
        super('/request');
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
            },
            {
                method: 'POST',
                path: CommonRoutes.getOneByQuery,
                handler: this.getOneByQuery as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(requestCreateSchema)],
                handler: this.add as RouteHandlerMethod
            },
            {
                method: 'PUT',
                path: `${CommonRoutes.update}/:id`,
                middlewares: [paramsValidator(uuidParamSchema), bodyValidator(requestUpdateSchema)],
                handler: this.update as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.delete as RouteHandlerMethod
            },
            {
                method: 'PUT',
                path: 'approve/:id',
                middlewares: [paramsValidator(uuidParamSchema), bodyValidator(requestReviewSchema)],
                handler: this.approve as RouteHandlerMethod
            },
            {
                method: 'PUT',
                path: 'reject/:id',
                middlewares: [paramsValidator(uuidParamSchema), bodyValidator(requestReviewSchema)],
                handler: this.reject as RouteHandlerMethod
            }
        ];
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IRequestRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    "Request records fetched successfully",
                    await this.requestService.get(request.user, req.body)
                )
            );
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        res.send(
            AppResponse.success(
                "Request record fetched successfully",
                await this.requestService.getById(req.params.id, request.user)
            )
        );
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IRequestRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Request record fetched successfully",
                    await this.requestService.getOne(request.user, req.body)
                )
            );
        }
    }

    private add = async (req: FastifyRequest<{Body: IRequestRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            // If no userId is specified, use the current user's ID
            if (!req.body.userId) {
                req.body.userId = request.user.id;
            }
            
            res.send(
                AppResponse.success(
                    "Request created successfully",
                    await this.requestService.add(req.body, request.user)
                )
            );
        }
    }

    private update = async (req: FastifyRequest<{Params: {id: string}, Body: IRequestRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Request updated successfully",
                    await this.requestService.update(req.params.id, req.body, request.user)
                )
            );
        }
    }

    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            await this.requestService.delete(req.params.id, request.user);
            res.send(
                AppResponse.success(
                    "Request deleted successfully",
                    null
                )
            );
        }
    }

    private approve = async (req: FastifyRequest<{Params: {id: string}, Body?: {reviewNotes?: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Request approved successfully",
                    await this.requestService.approveRequest(
                        req.params.id,
                        request.user.id,
                        req.body?.reviewNotes,
                        request.user
                    )
                )
            );
        }
    }

    private reject = async (req: FastifyRequest<{Params: {id: string}, Body?: {reviewNotes?: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Request rejected successfully",
                    await this.requestService.rejectRequest(
                        req.params.id,
                        request.user.id,
                        req.body?.reviewNotes,
                        request.user
                    )
                )
            );
        }
    }

}
