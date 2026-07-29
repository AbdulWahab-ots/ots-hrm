import { inject, injectable } from "tsyringe";
import { ControllerBase } from "./generics/controller-base";
import { CountryService } from "../bl";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { IFetchRequest, IFilter, IGetSingleRecordFilter, ICountryRequest } from "../models";
import { CommonRoutes } from "../constants/commonRoutes";
import { authorize } from "../middlewares/authentication";
import { payloadValidator } from "../middlewares";

@injectable()
export class CountryController extends ControllerBase {
    constructor(@inject('CountryService') private readonly countryService: CountryService){
        super('/country');
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


    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<ICountryRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        res.send(await this.countryService.get(request.user, req.body))

    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        res.send(await this.countryService.getById(req.params.id, request.user));
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<ICountryRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(await this.countryService.getOne(request.user, req.body));
        }    
    }
 
}