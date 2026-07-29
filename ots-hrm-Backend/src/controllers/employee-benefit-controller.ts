import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IEmployeeBenefitRequest, IEmployeeBenefitResponse, IGetSingleRecordFilter } from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { EmployeeBenefitService } from "../bl";
import { AppResponse } from "../utility";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";

@injectable()
export class EmployeeBenefitController extends ControllerBase {
    constructor(
        @inject('EmployeeBenefitService') private readonly employeeBenefitService: EmployeeBenefitService
    ) {
        super('/employee-benefit');
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
            }
        ];
    }

    private add = async (req: FastifyRequest<{ Body: IEmployeeBenefitRequest }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Employee benefit created successfully',
                await this.employeeBenefitService.add(req.body, request.user)
            ));
        }
    }

    private getAll = async (req: FastifyRequest<{ Body?: IFetchRequest<IEmployeeBenefitRequest> }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Employee benefits retrieved successfully',
                await this.employeeBenefitService.get(request.user, req.body)
            ));
        }
    }

    private getById = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if (request.user) {
            res.send(AppResponse.success(
                'Employee benefit retrieved successfully',
                await this.employeeBenefitService.getById(req.params.id, request.user)
            ));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{ Body: IGetSingleRecordFilter<IEmployeeBenefitRequest> }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Employee benefit retrieved successfully',
                await this.employeeBenefitService.getOne(request.user, req.body)
            ));
        }
    }

    private delete = async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Employee benefit deleted successfully',
                await this.employeeBenefitService.delete(req.params.id, request.user)
            ));
        }
    }

    private update = async (req: FastifyRequest<{ Body: IEmployeeBenefitRequest, Params: { id: string } }>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Employee benefit updated successfully',
                await this.employeeBenefitService.update(req.params.id, req.body, request.user)
            ));
        }
    }
} 