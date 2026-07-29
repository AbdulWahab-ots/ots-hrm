import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AppResponse } from "../utility";
import { IFetchRequest, IGetSingleRecordFilter, ISkillRequest } from "../models";
import { SkillService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { requireAdminAccess } from "../middlewares/permissions";
import { bodyValidator, paramsValidator } from "../middlewares/payload-validator";
import { createSkillSchema, updateSkillSchema, uuidParamSchema } from "../models/payload-schemas";

@injectable()
export class PerfSkillController extends ControllerBase {
    constructor(@inject('SkillService') private readonly skillService: SkillService) {
        super('/perf-skill');
        // Admin-only for the whole feature: non-admins get 403 (spec section 4).
        this.middleware = [authorize, validateCompanyHeader, requireAdminAccess()] as preHandlerHookHandler[];
        this.endPoints = [
            { method: 'POST', path: CommonRoutes.create, middlewares: [bodyValidator(createSkillSchema)], handler: this.add as RouteHandlerMethod },
            { method: 'POST', path: CommonRoutes.getAll, handler: this.getAll as RouteHandlerMethod },
            { method: 'GET', path: `${CommonRoutes.getById}/:id`, middlewares: [paramsValidator(uuidParamSchema)], handler: this.getById as RouteHandlerMethod },
            { method: 'POST', path: CommonRoutes.getOneByQuery, handler: this.getOneByQuery as RouteHandlerMethod },
            { method: 'PUT', path: `${CommonRoutes.update}/:id`, middlewares: [paramsValidator(uuidParamSchema), bodyValidator(updateSkillSchema)], handler: this.update as RouteHandlerMethod },
            { method: 'DELETE', path: `${CommonRoutes.delete}/:id`, middlewares: [paramsValidator(uuidParamSchema)], handler: this.delete as RouteHandlerMethod },
        ];
    }

    private add = async (req: FastifyRequest<{ Body: ISkillRequest }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) res.send(AppResponse.success('Skill created successfully', await this.skillService.add(req.body, request.user)));
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<ISkillRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) res.send(AppResponse.success('Fetched all skills successfully', await this.skillService.get(request.user, req.body)));
    }

    private getById = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) res.send(AppResponse.success('Fetched skill successfully', await this.skillService.getById(req.params.id, request.user)));
    }

    private getOneByQuery = async (req: FastifyRequest<{ Body: IGetSingleRecordFilter<ISkillRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) res.send(await this.skillService.getOne(request.user, req.body));
    }

    private update = async (req: FastifyRequest<{ Body: ISkillRequest, Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) res.send(AppResponse.success('Skill updated successfully', await this.skillService.update(req.params.id, req.body, request.user)));
    }

    private delete = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) res.send(AppResponse.success('Skill removed successfully', await this.skillService.delete(req.params.id, request.user)));
    }
}
