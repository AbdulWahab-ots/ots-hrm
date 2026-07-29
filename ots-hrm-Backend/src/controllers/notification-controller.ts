import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AppResponse } from "../utility";
import { IFetchRequest, INotificationRequest } from "../models";
import { NotificationService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { paramsValidator } from "../middlewares/payload-validator";
import { uuidParamSchema } from "../models/payload-schemas";

// Read + mark-read only — notifications are created internally by triggers, never via a
// public create endpoint. All routes are scoped to the calling user.
@injectable()
export class NotificationController extends ControllerBase {
    constructor(@inject('NotificationService') private readonly notificationService: NotificationService) {
        super('/notification');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.getAll,
                handler: this.getAll as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'unread-count',
                handler: this.unreadCount as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'mark-read/:id',
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.markRead as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'mark-all-read',
                handler: this.markAllRead as RouteHandlerMethod
            }
        ];
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<INotificationRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Fetched notifications successfully',
                await this.notificationService.getMine(request.user, req.body)
            ));
        }
    }

    private unreadCount = async (req: FastifyRequest, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Fetched unread count successfully',
                await this.notificationService.getUnreadCount(request.user)
            ));
        }
    }

    private markRead = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Notification marked as read',
                await this.notificationService.markRead(req.params.id, request.user)
            ));
        }
    }

    private markAllRead = async (req: FastifyRequest, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'All notifications marked as read',
                await this.notificationService.markAllRead(request.user)
            ));
        }
    }
}
