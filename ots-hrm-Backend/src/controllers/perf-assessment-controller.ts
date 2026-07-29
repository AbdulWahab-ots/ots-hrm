import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AppResponse } from "../utility";
import { IAssessmentRequest } from "../models";
import { AssessmentService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { requireAdminAccess } from "../middlewares/permissions";
import { bodyValidator, paramsValidator } from "../middlewares/payload-validator";
import { createAssessmentSchema, updateAssessmentSchema, uuidParamSchema } from "../models/payload-schemas";

@injectable()
export class PerfAssessmentController extends ControllerBase {
    constructor(@inject('AssessmentService') private readonly assessmentService: AssessmentService) {
        super('/perf-assessment');
        // Admin-only for the whole feature: non-admins get 403 (spec section 4).
        this.middleware = [authorize, validateCompanyHeader, requireAdminAccess()] as preHandlerHookHandler[];
        this.endPoints = [
            // Chart data: all assessments (+scores) for one employee.
            { method: 'GET', path: 'employee/:id', middlewares: [paramsValidator(uuidParamSchema)], handler: this.getForEmployee as RouteHandlerMethod },
            // Create one assessment with a set of skill scores in a single call.
            { method: 'POST', path: CommonRoutes.create, middlewares: [bodyValidator(createAssessmentSchema)], handler: this.create as RouteHandlerMethod },
            { method: 'PUT', path: `${CommonRoutes.update}/:id`, middlewares: [paramsValidator(uuidParamSchema), bodyValidator(updateAssessmentSchema)], handler: this.update as RouteHandlerMethod },
            { method: 'DELETE', path: `${CommonRoutes.delete}/:id`, middlewares: [paramsValidator(uuidParamSchema)], handler: this.delete as RouteHandlerMethod },
        ];
    }

    private getForEmployee = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success('Fetched assessments successfully', await this.assessmentService.getForEmployee(req.params.id, request.user)));
        }
    }

    private create = async (req: FastifyRequest<{ Body: IAssessmentRequest }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success('Assessment saved successfully', await this.assessmentService.create(req.body, request.user)));
        }
    }

    private update = async (req: FastifyRequest<{ Body: IAssessmentRequest, Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success('Assessment updated successfully', await this.assessmentService.update(req.params.id, req.body, request.user)));
        }
    }

    private delete = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success('Assessment deleted successfully', await this.assessmentService.delete(req.params.id, request.user)));
        }
    }
}
