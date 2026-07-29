import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IGetSingleRecordFilter, IBenefitRequest, BenefitType } from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { AppResponse } from "../utility";
import { BenefitService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { paramsValidator, bodyValidator } from "../middlewares/payload-validator";
import { uuidParamSchema, benefitSchemas } from "../models/payload-schemas";

@injectable()
export class BenefitController extends ControllerBase {
    constructor(@inject('BenefitService') private readonly benefitService: BenefitService){
        super('/benefit');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(benefitSchemas.create)],
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
                    bodyValidator(benefitSchemas.update)
                ],
                handler: this.update as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.delete as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: '/company-wide',
                handler: this.getCompanyWideBenefits as RouteHandlerMethod
            }
        ];
    }

    private add = async (req: FastifyRequest<{Body: IBenefitRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(AppResponse.success('Benefit added successfully', await this.benefitService.add(req.body, request.user)))
        }
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IBenefitRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if(request.user){
            res.send(AppResponse.success('Benefits fetched successfully', await this.benefitService.get(request.user, req.body)))
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        if(request.user){ 
            res.send(AppResponse.success('Benefit fetched successfully', await this.benefitService.getById(req.params.id, request.user)));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IBenefitRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success('Benefit fetched successfully', await this.benefitService.getOne(request.user, req.body)));
        }    
    }

    private update = async (req: FastifyRequest<{Body: IBenefitRequest, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success('Benefit updated successfully', await this.benefitService.update(req.params.id, req.body, request.user)));
        }  
    }

    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success('Benefit deleted successfully', await this.benefitService.delete(req.params.id, request.user)));
        }       
    }

    private getCompanyWideBenefits = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(AppResponse.success('Company-wide benefits fetched successfully', await this.benefitService.getCompanyWideBenefits(request.user)));
        }
    }
}
