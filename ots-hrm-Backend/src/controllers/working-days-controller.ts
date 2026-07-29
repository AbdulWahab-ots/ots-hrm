import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IFilter, IGetSingleRecordFilter, IWorkingDaysRequest, IWorkingDaysRequestSingle, IWorkingDaysResponse} from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { WorkingDaysService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { payloadValidator, bodyValidator, queryValidator, paramsValidator } from "../middlewares/payload-validator";
import { uuidParamSchema, createWorkingDaysSchema, updateWorkingDaysSchema, uuidDepartmentParamSchema} from "../models/payload-schemas";
import { AppResponse } from "../utility";

@injectable()
export class WorkingDaysController extends ControllerBase {
    constructor(@inject('WorkingDaysService') private readonly workingDaysService: WorkingDaysService){
        super('/working-days');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(createWorkingDaysSchema)],
                handler: this.createWorkingDays as RouteHandlerMethod
            },
            {
                method: 'PUT',
                path: CommonRoutes.update,
                middlewares: [bodyValidator(updateWorkingDaysSchema)],
                handler: this.updateWorkingDays as RouteHandlerMethod
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
                method: 'GET',
                path: 'effective/:departmentId',
                middlewares: [paramsValidator(uuidDepartmentParamSchema)],
                handler: this.getEffectiveWorkingDays as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: '/company-defaults',
                handler: this.getCompanyDefaults as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: '/department/:departmentId',
                middlewares: [paramsValidator(uuidDepartmentParamSchema)],
                handler: this.getDepartmentSpecific as RouteHandlerMethod
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
            }
        ];    
    }

    /**
     * Create working days (all 7 days required)
     */
    private createWorkingDays = async (req: FastifyRequest<{Body: IWorkingDaysRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Working days created successfully',
                await this.workingDaysService.createWorkingDays(req.body, request.user)
            ));
        }
    }

    /**
     * Update working days (can be single or multiple days)
     */
    private updateWorkingDays = async (req: FastifyRequest<{Body: IWorkingDaysRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Working days updated successfully',
                await this.workingDaysService.updateWorkingDays(req.body, request.user)
            ));
        }
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IWorkingDaysRequestSingle>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Working days retrieved successfully',
                await this.workingDaysService.get(request.user, req.body)
            ));
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Working day retrieved successfully',
                await this.workingDaysService.getById(req.params.id, request.user)
            ));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IWorkingDaysRequestSingle>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Working day retrieved successfully',
              await this.workingDaysService.getOne(request.user, req.body)
          ));
        }
    }
 
    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Working day deleted successfully',
              await this.workingDaysService.delete(req.params.id, request.user)
          ));
        }
    }

    /**
     * Get effective working days for a department (department-specific + company defaults)
     */
    private getEffectiveWorkingDays = async (req: FastifyRequest<{Params: {departmentId: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Effective working days retrieved successfully',
                await this.workingDaysService.getEffectiveWorkingDaysForDepartment(req.params.departmentId, request.user)
            ));
        }
    }

    /**
     * Get company-wide default working days
     */
    private getCompanyDefaults = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Company default working days retrieved successfully',
                await this.workingDaysService.getCompanyDefaultWorkingDays(request.user)
            ));
        }
    }

    /**
     * Get department-specific working days only
     */
    private getDepartmentSpecific = async (req: FastifyRequest<{Params: {departmentId: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Department-specific working days retrieved successfully',
                await this.workingDaysService.getDepartmentSpecificWorkingDays(req.params.departmentId, request.user)
            ));
        }
    }

}