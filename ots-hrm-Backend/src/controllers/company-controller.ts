import { injectable, inject } from "tsyringe";
import { ControllerBase } from "./generics/controller-base";
import { CompanyService } from "../bl";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ICompanyRequest, IFetchRequest, IFilter, RelationLoad } from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { CommonRoutes } from "../constants/commonRoutes";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { hasPermission } from "../middlewares/index";
import { payloadValidator } from "../middlewares/payload-validator";
import { createCompanySchema } from "../models/payload-schemas";
import { AppResponse } from "../utility";
import { DefaultRoles } from "../constants";

@injectable()
export class CompanyController extends ControllerBase {
    constructor(@inject('CompanyService') private readonly companyService: CompanyService) {
        super('/company');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [ 
                    hasPermission('createCompany') as preHandlerHookHandler,
                    payloadValidator({ body: createCompanySchema })
                ],
                handler: this.addCompany as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.getAll,
                middlewares: [hasPermission('getCompany') as preHandlerHookHandler],
                handler: this.getAll as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: `${CommonRoutes.getById}/:id`,
                middlewares: [hasPermission('getCompany') as preHandlerHookHandler],
                handler: this.getById as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.getOneByQuery,
                middlewares: [hasPermission('getCompany') as preHandlerHookHandler],
                handler: this.getOneByQuery as RouteHandlerMethod
            },
            {
                method: 'PUT',
                path: `${CommonRoutes.update}/:id`,
                middlewares: [hasPermission('updateCompany') as preHandlerHookHandler],
                handler: this.update as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                middlewares: [hasPermission('deleteCompany') as preHandlerHookHandler],
                handler: this.delete as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'exists',
                middlewares: [hasPermission('getCompany') as preHandlerHookHandler],
                handler: this.checkExists as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'statistics/:companyId?',
                // middlewares: [hasPermission('getCompany') as preHandlerHookHandler],
                handler: this.getCompanyStatistics as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'dashboard-stats',
                handler: this.getDashboardStats as RouteHandlerMethod
            },
            {
                method: 'PATCH',
                path: 'toggle-active/:id',
                middlewares: [hasPermission('updateCompany') as preHandlerHookHandler],
                handler: this.toggleActive as RouteHandlerMethod
            }
        ];
    }

    private addCompany = async (req: FastifyRequest<{Body: ICompanyRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    'Company created successfully',
                    await this.companyService.addNewCompany(req.body, request.user)
                )
            );
        }
    }

    private getAll = async (req: FastifyRequest<{Body: IFetchRequest<ICompanyRequest> | undefined}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    'Companies fetched successfully',
                    await this.companyService.get(request.user, req.body)
                )
            );
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    'Company fetched successfully',
                    await this.companyService.getById(req.params.id, request.user)
                )
            );
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: {filters:Array<IFilter<ICompanyRequest, keyof ICompanyRequest>>, relations?: RelationLoad<ICompanyRequest>}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    'Company fetched successfully',
                    await this.companyService.getOne(request.user, req.body)
                )
            );
        }
    }

    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(
            AppResponse.success(
              'Company deleted successfully',
              await this.companyService.delete(req.params.id, request.user)
            )
          );
        }       
    }

    private update = async (req: FastifyRequest<{Body: ICompanyRequest, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(
            AppResponse.success(
              'Company updated successfully',
              await this.companyService.update(req.params.id, req.body, request.user)
            )
          );
        }
    }

    private checkExists = async (req: FastifyRequest<{Body: {name: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            const exists = await this.companyService.existsByName(req.body.name);
            res.send(
                AppResponse.success(
                    'Company existence checked successfully',
                    { exists }
                )
            );
        }
    }

    private toggleActive = async (req: FastifyRequest<{ Params: { id: string }; Body: { active: boolean } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (!request.user) return;
        try {
            const result = await this.companyService.toggleCompanyActive(req.params.id, req.body.active, request.user);
            res.send(AppResponse.success('Company status updated successfully', result));
        } catch (error) {
            res.status(500).send(AppResponse.error(error instanceof Error ? error.message : 'Failed to update company status'));
        }
    }

    private getDashboardStats = async (req: FastifyRequest, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (!request.user || request.user.role !== DefaultRoles.SuperAdmin) {
            return res.status(403).send(AppResponse.error('Access denied. Only super admin can access this endpoint.'));
        }
        try {
            const stats = await this.companyService.getSuperAdminDashboardStats();
            res.send(AppResponse.success('Dashboard stats fetched successfully', stats));
        } catch (error) {
            res.status(500).send(AppResponse.error(error instanceof Error ? error.message : 'Failed to fetch dashboard stats'));
        }
    }

    private getCompanyStatistics = async (req: FastifyRequest<{Params: {companyId?: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            try {
                // For super admin, companyId is required in params
                // For admin, use their companyId from the token
                let targetCompanyId: string;
                
                if (request.user.role === DefaultRoles.SuperAdmin) {
                    if (!req.params.companyId) {
                        return res.status(400).send(
                            AppResponse.error('Company ID is required for super admin')
                        );
                    }
                    targetCompanyId = req.params.companyId;
                } else if (request.user.role === DefaultRoles.Admin) {
                    targetCompanyId = request.user.companyId;
                } else {
                    return res.status(403).send(
                        AppResponse.error('Access denied. Only admin and super admin can access this endpoint.')
                    );
                }

                const statistics = await this.companyService.getCompanyStatistics(targetCompanyId);
                res.send(
                    AppResponse.success(
                        'Company statistics fetched successfully',
                        statistics
                    )
                );
            } catch (error) {
                res.status(500).send(
                    AppResponse.error(
                        error instanceof Error ? error.message : 'Failed to fetch company statistics'
                    )
                );
            }
        }
    }
}