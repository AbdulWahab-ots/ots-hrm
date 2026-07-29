import { inject, injectable } from "tsyringe";
import { ControllerBase } from "./generics/controller-base";
import { MasterEnumService } from "../bl";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { IFetchRequest, IFilter, IGetSingleRecordFilter, IMasterEnumRequest, IToDoRequest, todoRequestSchema } from "../models";
import { CommonRoutes } from "../constants/commonRoutes";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { AppResponse } from "../utility";

@injectable()
export class MasterEnumController extends ControllerBase {
    constructor(@inject('MasterEnumService') private readonly masterEnumService: MasterEnumService){
        super('/master-enum');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'GET',
                path: CommonRoutes.getAll,
                handler: this.getAll as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.getOneByQuery,
                handler: this.getOneByQuery as RouteHandlerMethod
            }
        ];

    }

    

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IMasterEnumRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        res.send(
            AppResponse.success(
                'Master Enum Records fetched successfully',
                await this.masterEnumService.getAll()
            )
        )

    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IMasterEnumRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(await this.masterEnumService.getOne(request.user, req.body));
        }    
    }
 

}