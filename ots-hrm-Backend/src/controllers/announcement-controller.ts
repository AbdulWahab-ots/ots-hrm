import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AppResponse } from "../utility";
import { IFetchRequest, IGetSingleRecordFilter, IAnnouncementRequest } from "../models";
import { AnnouncementService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { requireAdminAccess } from "../middlewares/permissions";
import { bodyValidator, paramsValidator } from "../middlewares/payload-validator";
import { createAnnouncementSchema, updateAnnouncementSchema, uuidParamSchema } from "../models/payload-schemas";

@injectable()
export class AnnouncementController extends ControllerBase {
    constructor(@inject('AnnouncementService') private readonly announcementService: AnnouncementService) {
        super('/announcement');
        // Reads are open to any authenticated company user (employees see announcements);
        // writes require admin access (announcements are admin-authored). requireAdminAccess
        // is applied per write-endpoint, same guard the invite controller uses.
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [requireAdminAccess(), bodyValidator(createAnnouncementSchema)],
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
                    requireAdminAccess(),
                    paramsValidator(uuidParamSchema),
                    bodyValidator(updateAnnouncementSchema)
                ],
                handler: this.update as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                middlewares: [requireAdminAccess(), paramsValidator(uuidParamSchema)],
                handler: this.delete as RouteHandlerMethod
            }
        ];
    }

    private add = async (req: FastifyRequest<{ Body: IAnnouncementRequest }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Announcement created successfully',
                await this.announcementService.add(req.body, request.user),
            ));
        }
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<IAnnouncementRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Fetched all announcements successfully',
                await this.announcementService.get(request.user, req.body)
            ));
        }
    }

    private getById = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Fetched announcement successfully',
                await this.announcementService.getById(req.params.id, request.user)
            ));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{ Body: IGetSingleRecordFilter<IAnnouncementRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Fetched announcement successfully',
                await this.announcementService.getOne(request.user, req.body)
            ));
        }
    }

    private update = async (req: FastifyRequest<{ Body: IAnnouncementRequest, Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Announcement updated successfully',
                await this.announcementService.update(req.params.id, req.body, request.user)
            ));
        }
    }

    private delete = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Announcement deleted successfully',
                await this.announcementService.delete(req.params.id, request.user)
            ));
        }
    }
}
