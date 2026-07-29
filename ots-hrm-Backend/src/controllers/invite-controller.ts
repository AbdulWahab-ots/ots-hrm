import { inject, injectable } from "tsyringe";
import { ControllerBase } from "./generics/controller-base";
import { InviteService } from "../bl";
import { CommonRoutes } from "../constants";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ExtendedRequest, IFetchRequest, IGetSingleRecordFilter, IInviteCreateRequest, IInviteRequest, IInviteRequestBody } from "../models";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { requireAdminAccess } from "../middlewares/permissions";
import { paramsValidator, payloadValidator } from "../middlewares/payload-validator";
import {
    createInviteRequestSchema,
    uuidParamSchema,
} from "../models/payload-schemas";
import { AppResponse } from "../utility";

@injectable()
export class InviteController extends ControllerBase {
    constructor(@inject('InviteService') private readonly inviteService: InviteService) {
        super('/invite');
        // Invite management (create/list/delete/resend) is an admin-only capability;
        // creation otherwise defaults to handing out an ADMIN-role invite to any caller.
        this.middleware = [authorize, validateCompanyHeader, requireAdminAccess()] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [payloadValidator({ body: createInviteRequestSchema })],
                handler: this.add as RouteHandlerMethod
            }, 
            {
                method: 'POST',
                path: CommonRoutes.getAll,
                handler: this.getAll as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.getOneByQuery,
                handler: this.getOneByQuery as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.delete as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'resend/:id',
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.resendInvite as RouteHandlerMethod
            }
        ];
    }

    private add = async (request: FastifyRequest<{ Body: IInviteRequestBody }>, reply: FastifyReply) => {
        const contextUser = (request as ExtendedRequest).user!;
        const result = await this.inviteService.createInvites(request.body, contextUser);

        // Check if it's a bulk response
        if ('successful' in result) {
            // Bulk invite response
            const successMessage = result.successCount === result.totalProcessed 
                ? `All ${result.totalProcessed} invites sent successfully`
                : `${result.successCount} of ${result.totalProcessed} invites sent successfully`;
            
            reply.status(201).send(AppResponse.success(successMessage, result));
        } else {
            // Single invite response
            reply.status(201).send(AppResponse.success('Invite created successfully', result));
        }
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<IInviteRequest> }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Invites fetched successfully',
                await this.inviteService.get(request.user, req.body)
            ))
        }
    }


    private getOneByQuery = async (req: FastifyRequest<{ Body: IGetSingleRecordFilter<IInviteRequest> }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Invite fetched successfully',
                await this.inviteService.getOne(request.user, req.body)
            ));
        }
    }

    private delete = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Invite deleted successfully',
                await this.inviteService.delete(req.params.id, request.user)
            ));
        }
    }

    private resendInvite = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Invite resent successfully',
                await this.inviteService.resendInvite(req.params.id, request.user)
            ));
        }
    }

}
