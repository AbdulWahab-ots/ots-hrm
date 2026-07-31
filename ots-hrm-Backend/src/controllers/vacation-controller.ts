import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IFilter, IVacationRequest, IVacationStatusRequest, IVacationResponse, IGetSingleRecordFilter} from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { VacationService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { payloadValidator, bodyValidator, queryValidator, paramsValidator } from "../middlewares/payload-validator";
import { uuidParamSchema, createVacationsSchema, updateStatusVacationsSchema, updateVacationsSchema} from "../models/payload-schemas";
import { AppResponse } from "../utility";


@injectable()
export class VacationController extends ControllerBase {
    constructor(@inject('VacationService') private readonly vacationService: VacationService){
        super('/vacation');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(createVacationsSchema)],
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
                    paramsValidator(uuidParamSchema),
                    bodyValidator(updateVacationsSchema)
                ],
                handler: this.update as RouteHandlerMethod
            },
            {
                method: 'PUT',
                path: `${CommonRoutes.update}/status/:id`,
                middlewares: [
                    paramsValidator(uuidParamSchema),
                    bodyValidator(updateStatusVacationsSchema)
                ],
                handler: this.updateStatus as RouteHandlerMethod
            },
            {
                method: 'PUT',
                path: `${CommonRoutes.update}/cancel/:id`,
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.cancelVacation as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.delete as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'leave-balance',
                handler: this.leaveBalance as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'remote-work-stats',
                handler: this.getRemoteWorkStats as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'leave-stats',
                handler: this.getLeaveStats as RouteHandlerMethod
            },
        ];

    }


    private add = async (req: FastifyRequest<{Body: IVacationRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    'Vacation created successfully',
                    await this.vacationService.add(req.body, request.user)
                )
            )
        }
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IVacationRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        console.log('Fetching vacations with request:', req?.body?.queryOptionsRequest?.filtersRequest);

        if(request.user){
            res.send(AppResponse.success(
                'Vacations fetched successfully',
                await this.vacationService.get(request.user, req.body)
            ))  
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(AppResponse.success(
                'Vacation fetched successfully',
                await this.vacationService.getById(req.params.id, request.user)
            ))  
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IVacationRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Vacation fetched successfully',
              await this.vacationService.getOne(request.user, req.body)
          ));
        }
    }
 
    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Vacation deleted successfully',
              await this.vacationService.delete(req.params.id, request.user)
          ));
        }   
    }

    private updateStatus = async (req: FastifyRequest<{Body: IVacationStatusRequest, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Vacation Status updated successfully',
              await this.vacationService.updateStatus(req.params.id, req.body, request.user)
          ));
        }  
    }

    private update = async (req: FastifyRequest<{Body: IVacationRequest, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Vacation updated successfully',
              await this.vacationService.update(req.params.id, req.body, request.user)
          ));
        }  
    }

    private leaveBalance = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Leave balance fetched successfully',
                await this.vacationService.leaveBalance(request.user )
            ));
        }
    }

    private cancelVacation = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Vacation cancelled successfully',
                await this.vacationService.cancelVacation(req.params.id, request.user)
            ));
        }
    }

    private getRemoteWorkStats = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Remote work statistics fetched successfully',
                await this.vacationService.getRemoteWorkStats(request.user)
            ));
        }
    }

    private getLeaveStats = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(AppResponse.success(
                'Leave statistics fetched successfully',
                await this.vacationService.getLeaveStats(request.user)
            ));
        }
    }

}