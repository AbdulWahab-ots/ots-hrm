import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AppResponse } from "../utility";
import { IFetchRequest, IGetSingleRecordFilter, ICandidateRequest } from "../models";
import { CandidateService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { bodyValidator, paramsValidator } from "../middlewares/payload-validator";
import { createCandidateBulkSchema, updateCandidateSchema, uuidParamSchema } from "../models/payload-schemas";

@injectable()
export class CandidateController extends ControllerBase {
    constructor(@inject('CandidateService') private readonly candidateService: CandidateService) {
        super('/tracker-candidate');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(createCandidateBulkSchema)],
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
                middlewares: [paramsValidator(uuidParamSchema), bodyValidator(updateCandidateSchema)],
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

    // Accepts a single candidate or an array (bulk import).
    private add = async (req: FastifyRequest<{ Body: ICandidateRequest | ICandidateRequest[] }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (!request.user) return;

        if (Array.isArray(req.body)) {
            res.send(AppResponse.success(
                'Candidates created successfully',
                await this.candidateService.addMany(req.body, request.user)
            ));
        } else {
            res.send(AppResponse.success(
                'Candidate created successfully',
                await this.candidateService.add(req.body, request.user)
            ));
        }
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<ICandidateRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Fetched all candidates successfully',
                await this.candidateService.get(request.user, req.body)
            ));
        }
    }

    private getById = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Fetched candidate successfully',
                await this.candidateService.getById(req.params.id, request.user)
            ));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{ Body: IGetSingleRecordFilter<ICandidateRequest> }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(await this.candidateService.getOne(request.user, req.body));
        }
    }

    private update = async (req: FastifyRequest<{ Body: ICandidateRequest, Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Candidate updated successfully',
                await this.candidateService.update(req.params.id, req.body, request.user)
            ));
        }
    }

    private delete = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Candidate deleted successfully',
                await this.candidateService.delete(req.params.id, request.user)
            ));
        }
    }
}
