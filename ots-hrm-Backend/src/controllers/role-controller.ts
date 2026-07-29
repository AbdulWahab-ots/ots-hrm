import { inject, injectable } from "tsyringe";
import { ControllerBase } from "./generics/controller-base";
import { RoleService } from "../bl";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { IFetchRequest, IFilter, IGetSingleRecordFilter, IRoleRequest } from "../models";
import { AppResponse } from "../utility";
import { CommonRoutes } from "../constants/commonRoutes";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { payloadValidator, bodyValidator, queryValidator, paramsValidator } from "../middlewares/payload-validator";
import { uuidParamSchema, createRRoleSchema, updateRoleSchema } from "../models/payload-schemas";

@injectable()
export class RoleController extends ControllerBase {
    constructor(@inject('RoleService') private readonly roleService: RoleService){
        super('/role');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(createRRoleSchema)],
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
                    bodyValidator(updateRoleSchema)
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

    
    private add = async (req: FastifyRequest<{Body: IRoleRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(AppResponse.success(
                'Role created successfully',
                await this.roleService.add(req.body, request.user)
            ));
        }
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IRoleRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        res.send(AppResponse.success(
            'Fetched all roles successfully',
            await this.roleService.get(request.user, req.body)
        ));
        if(request.user){
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        res.send(AppResponse.success(
            'Fetched role successfully',
            await this.roleService.getById(req.params.id, request.user)
        ));
        if(request.user){
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IRoleRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Fetched role successfully',
              await this.roleService.getOne(request.user, req.body)
          ));
        }
    }
 
    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Role deleted successfully',
              await this.roleService.delete(req.params.id, request.user)
          ));
        }
    }

    private update = async (req: FastifyRequest<{Body: IRoleRequest, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success(
              'Role updated successfully',
              await this.roleService.update(req.params.id, req.body, request.user)
          ));
        }
    }
}