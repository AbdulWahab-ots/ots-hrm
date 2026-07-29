import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AppResponse } from "../utility";
import { IFetchRequest, IFilter, IGetSingleRecordFilter, IDesignationRequest } from "../models";
import { DesignationService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { bodyValidator, queryValidator, paramsValidator } from "../middlewares/payload-validator";
import { createDesignationSchema, updateDesignationSchema, uuidParamSchema, } from "../models/payload-schemas";


@injectable()
export class DesignationController extends ControllerBase {
    constructor(@inject('DesignationService') private readonly designationService: DesignationService){
        super('/designation');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(createDesignationSchema)],
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
                    bodyValidator(updateDesignationSchema)
                ],
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

    
    private add = async (req: FastifyRequest<{Body: IDesignationRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(AppResponse.success(
                'Designation created successfully',
                await this.designationService.add(req.body, request.user),
            ));
        }
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IDesignationRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if(request.user){
            res.send(AppResponse.success(
                'Fetched all designations successfully',
                await this.designationService.get(request.user, req.body)
            ));
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if(request.user){

        res.send(AppResponse.success(
            'Fetched designation successfully',
            await this.designationService.getById(req.params.id, request.user)
        ));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IDesignationRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(await this.designationService.getOne(request.user, req.body));
        }    
    }
 
    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Designation deleted successfully',
              await this.designationService.delete(req.params.id, request.user)
          ));
        }
    }

    private update = async (req: FastifyRequest<{Body: IDesignationRequest, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Designation updated successfully',
              await this.designationService.update(req.params.id, req.body, request.user)
          ));
        }
    }

}