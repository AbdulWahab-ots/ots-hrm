import { inject, injectable } from "tsyringe";
import { ControllerBase } from "./generics/controller-base";
import { PrivilegeService } from "../bl";
import { CommonRoutes } from "../constants";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ExtendedRequest, IFetchRequest, IFilter, IGetSingleRecordFilter } from "../models";
import { Privilege } from "../entities";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";

@injectable()
export class PrivilegeController extends ControllerBase {
    constructor(@inject('PrivilegeService') private readonly privilegeService: PrivilegeService){
        super('/privilege');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
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
            }
        ];

    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<Privilege>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            let result = await this.privilegeService.get(undefined, req.body)
            res.send(result)
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(await this.privilegeService.getById(req.params.id, request.user));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<Privilege>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(await this.privilegeService.getOne(request.user, req.body));
        }    
    }
}