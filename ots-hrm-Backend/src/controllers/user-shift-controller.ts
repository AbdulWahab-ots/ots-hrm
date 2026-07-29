import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IUserShiftRequest, IUserShiftResponse, IAssignShiftRequest, IGetSingleRecordFilter } from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { UserShiftService } from "../bl";
import { AppResponse } from "../utility";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";

@injectable()
export class UserShiftController extends ControllerBase {
    constructor(
        @inject('UserShiftService') private readonly userShiftService: UserShiftService
    ) {
        super('/user-shift');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
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
                handler: this.update as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                handler: this.delete as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: '/active-shift/:userId',
                handler: this.getActiveShift as RouteHandlerMethod
            }
        ];
    }

    private add = async (req: FastifyRequest<{ Body: IUserShiftRequest }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            const result = await this.userShiftService.assignOrUpdateUserShift(
                req.body, 
                request.user
            );

            if (result) {
                res.send(AppResponse.success(
                    'User shift assigned successfully',
                    result
                ));
            } else {
                res.send(AppResponse.success(
                    'User already has the same shift assigned - no changes made',
                    null
                ));
            }
        }
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<IUserShiftRequest> }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'User shifts retrieved successfully',
                await this.userShiftService.get(request.user, req.body)
            ));
        }
    }

    private getById = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'User shift retrieved successfully',
                await this.userShiftService.getById(req.params.id, request.user)
            ));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{ Body: IGetSingleRecordFilter<IUserShiftRequest> }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'User shift retrieved successfully',
                await this.userShiftService.getOne(request.user, req.body)
            ));
        }
    }

    private delete = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'User shift deleted successfully',
                await this.userShiftService.delete(req.params.id, request.user)
            ));
        }
    }

    private update = async (req: FastifyRequest<{ Body: IUserShiftRequest, Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'User shift updated successfully',
                await this.userShiftService.update(req.params.id, req.body, request.user)
            ));
        }
    }

    /**
     * Get the current active shift for a user
     */
    private getActiveShift = async (req: FastifyRequest<{ Params: { userId: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            const activeShift = await this.userShiftService.getCurrentActiveShift(
                req.params.userId, 
                request.user
            );

            res.send(AppResponse.success(
                'Active shift retrieved successfully',
                activeShift
            ));
        }
    }
}
