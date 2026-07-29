import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AppResponse } from "../utility";
import { IFetchRequest, IGetSingleRecordFilter, IProjectRequest } from "../models";
import { ProjectService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { bodyValidator, paramsValidator } from "../middlewares/payload-validator";
import { createProjectBulkSchema, updateProjectSchema, uuidParamSchema } from "../models/payload-schemas";

@injectable()
export class ProjectController extends ControllerBase {
    constructor(@inject('ProjectService') private readonly projectService: ProjectService) {
        super('/tracker-project');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(createProjectBulkSchema)],
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
                middlewares: [paramsValidator(uuidParamSchema), bodyValidator(updateProjectSchema)],
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

    // Accepts a single project or an array (bulk import).
    private add = async (req: FastifyRequest<{ Body: IProjectRequest | IProjectRequest[] }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (!request.user) return;

        if (Array.isArray(req.body)) {
            res.send(AppResponse.success(
                'Projects created successfully',
                await this.projectService.addMany(req.body, request.user)
            ));
        } else {
            res.send(AppResponse.success(
                'Project created successfully',
                await this.projectService.add(req.body, request.user)
            ));
        }
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<IProjectRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Fetched all projects successfully',
                await this.projectService.get(request.user, req.body)
            ));
        }
    }

    private getById = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Fetched project successfully',
                await this.projectService.getById(req.params.id, request.user)
            ));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{ Body: IGetSingleRecordFilter<IProjectRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(await this.projectService.getOne(request.user, req.body));
        }
    }

    private update = async (req: FastifyRequest<{ Body: IProjectRequest, Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Project updated successfully',
                await this.projectService.update(req.params.id, req.body, request.user)
            ));
        }
    }

    private delete = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Project deleted successfully',
                await this.projectService.delete(req.params.id, request.user)
            ));
        }
    }
}
