import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { IFetchRequest, IFilter, IEmployeeRequest, IEmployeeResponse, IGetSingleRecordFilter} from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { EmployeeService, EmployeeMilestoneService } from "../bl";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { requireAdminAccess } from "../middlewares/permissions";
import { payloadValidator, bodyValidator, queryValidator, paramsValidator } from "../middlewares/payload-validator";
import { uuidParamSchema, createEmployeeSchema, updateEmployeeSchema, resignEmployeeSchema } from "../models/payload-schemas";
import { AppResponse } from "../utility";


@injectable()
export class EmployeeController extends ControllerBase {
    constructor(
        @inject('EmployeeService') private readonly employeeService: EmployeeService,
        @inject('EmployeeMilestoneService') private readonly employeeMilestoneService: EmployeeMilestoneService
    ){
        super('/employee');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [bodyValidator(createEmployeeSchema)],
                handler: this.add as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'onboard',
                middlewares: [bodyValidator(updateEmployeeSchema)],
                handler: this.onboard as RouteHandlerMethod
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
                    bodyValidator(updateEmployeeSchema)
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
                path: `stats`,
                handler: this.getStats as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: `next-code`,
                handler: this.getNextEmployeeCode as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: `trigger-milestone-check`,
                middlewares: [requireAdminAccess()],
                handler: this.triggerMilestoneCheck as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: `with-shifts`,
                handler: this.getEmployeesWithShifts as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: `${CommonRoutes.getById}/:id/with-shift`,
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.getEmployeeWithShift as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: `:id/send-set-password-email`,
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.sendSetPasswordEmail as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: `:id/resign`,
                middlewares: [
                    paramsValidator(uuidParamSchema),
                    bodyValidator(resignEmployeeSchema)
                ],
                handler: this.resignEmployee as RouteHandlerMethod
            }

        ];

    }


    private add = async (req: FastifyRequest<{Body: IEmployeeRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    "Employee created successfully",
                    await this.employeeService.add(req.body, request.user),
                )
            )
        }
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IEmployeeRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    "Fetched all employees successfully",
                    await this.employeeService.get(request.user, req.body)
                )
            );
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    "Fetched employee by ID successfully",
                    await this.employeeService.getById(req.params.id, request.user)
                )
            );
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IEmployeeRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(
              AppResponse.success(
                  "Fetched employee by query successfully",
                  await this.employeeService.getOne(request.user, req.body)
              )
          );
        }
    }
 
    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(
              AppResponse.success(
                  "Deleted employee successfully",
                  await this.employeeService.delete(req.params.id, request.user)
              )
          );
        }
    }

    private update = async (req: FastifyRequest<{Body: IEmployeeRequest, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(
              AppResponse.success(
                  "Updated employee successfully",
                  await this.employeeService.update(req.params.id, req.body, request.user)
              )
          );
        }
    }

    private getStats = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Fetched employee stats successfully",
                    await this.employeeService.getStats(request.user)
                )
            );
        }
    }

    private getNextEmployeeCode = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Fetched next employee code successfully",
                    { code: await this.employeeService.getNextEmployeeCode(request.user) }
                )
            );
        }
    }

    // Manual test/backfill trigger for the daily birthday/work-anniversary check,
    // scoped to the calling admin's own company only (the automatic cron covers every
    // company; a company admin has no business forcing a check on other tenants).
    private triggerMilestoneCheck = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Milestone check completed successfully",
                    await this.employeeMilestoneService.checkAndNotifyForCompany(request.user.companyId, request.user)
                )
            );
        }
    }

    private onboard = async (req: FastifyRequest<{Body: IEmployeeRequest & {existingEmail?: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;
        const { existingEmail, ...employeeData } = req.body;

        if (request.user) {
            res.send(
                AppResponse.success(
                    existingEmail ? "Employee updated successfully" : "Employee created successfully",
                    await this.employeeService.onboardEmployee(employeeData, request.user)
                )
            );
        }
    }

    private getEmployeesWithShifts = async (req: FastifyRequest, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Fetched employees with shifts successfully",
                    await this.employeeService.getEmployeesWithShifts(request.user)
                )
            );
        }
    }

    private sendSetPasswordEmail = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            await this.employeeService.sendSetPasswordEmail(req.params.id, request.user);
            res.send(AppResponse.success("Set-password email sent successfully"));
        }
    }

    private resignEmployee = async (req: FastifyRequest<{Body: {status: string, effectiveDate: string}, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    "Employee status updated successfully",
                    await this.employeeService.resignEmployee(
                        req.params.id,
                        { status: req.body.status as any, effectiveDate: req.body.effectiveDate },
                        request.user
                    )
                )
            );
        }
    }

    private getEmployeeWithShift = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            const result = await this.employeeService.getEmployeeWithShift(req.params.id, request.user);
            if (result) {
                res.send(
                    AppResponse.success(
                        "Fetched employee with shift successfully",
                        result
                    )
                );
            } else {
                res.status(404).send(
                    AppResponse.error("Employee not found")
                );
            }
        }
    }

}