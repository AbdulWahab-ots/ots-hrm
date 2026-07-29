import { inject, injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants/commonRoutes";
import { 
    IFetchRequest, 
    IFilter, 
    IPayrollRequest, 
    IPayrollResponse, 
    IGetSingleRecordFilter, 
    IPayrollAdjustmentRequest, 
    IPayrollAdjustmentResponse, 
    ISalarySlipGenerationRequest, 
    ISalarySlipGenerationResponse,
    IManualAdjustmentRequest,
    IManualAdjustmentResponse,
    IPayrollApprovalRequest
} from "../models";
import { ExtendedRequest } from "../models/inerfaces/extended-Request";
import { PayrollService } from "../bl/payroll-service";
import { PayrollAdjustmentService } from "../bl/payroll-adjustment-service";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { payloadValidator, bodyValidator, queryValidator, paramsValidator } from "../middlewares/payload-validator";
import { requireAdminAccess } from "../middlewares/permissions";
import { uuidParamSchema, salarySlipGenerationSchema, manualAdjustmentSchema, payrollUuidParamSchema, adjustmentUuidParamSchema, payrollApprovalSchema} from "../models/payload-schemas";
import { AppResponse } from "../utility";

@injectable()
export class PayrollController extends ControllerBase {
    constructor(
        @inject('PayrollService') private readonly payrollService: PayrollService,
        @inject('PayrollAdjustmentService') private readonly adjustmentService: PayrollAdjustmentService
    ){
        super('/payroll');
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
                middlewares: [paramsValidator(uuidParamSchema)],
                handler: this.getById as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.getOneByQuery,
                handler: this.getOneByQuery as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                middlewares: [requireAdminAccess(), paramsValidator(uuidParamSchema)],
                handler: this.delete as RouteHandlerMethod
            },
            // Salary Slip Generation Endpoint
            {
                method: 'POST',
                path: 'generate-salary-slips',
                middlewares: [requireAdminAccess(), bodyValidator(salarySlipGenerationSchema)],
                handler: this.generateSalarySlips as RouteHandlerMethod
            },
            // Payroll Adjustment Endpoints
            {
                method: 'POST',
                path: 'adjustment/:payrollId',
                middlewares: [
                    requireAdminAccess(),
                    paramsValidator(payrollUuidParamSchema),
                    bodyValidator(manualAdjustmentSchema)
                ],
                handler: this.addAdjustment as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'adjustment/:payrollId',
                middlewares: [paramsValidator(payrollUuidParamSchema)],
                handler: this.getAdjustmentsByPayroll as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: 'adjustment/:adjustmentId',
                middlewares: [requireAdminAccess(), paramsValidator(adjustmentUuidParamSchema)],
                handler: this.deleteAdjustment as RouteHandlerMethod
            },
            // Payroll Approval Endpoint - Admin Only
            {
                method: 'POST',
                path: 'status-update',
                middlewares: [
                    requireAdminAccess(),
                    bodyValidator(payrollApprovalSchema)
                ],
                handler: this.approvePayroll as RouteHandlerMethod
            }
        ];
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IPayrollRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    "Payrolls retrieved successfully",
                    await this.payrollService.get(request.user, req.body),
                )
            )
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    "Payroll retrieved successfully",
                    await this.payrollService.getById(req.params.id, request.user),
                )
            )
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IPayrollRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(
                AppResponse.success(
                    "Payroll retrieved successfully",
                    await this.payrollService.getOne(request.user, req.body),
                )
            )
        }
    }

    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            await this.payrollService.delete(req.params.id, request.user);
            res.send(
                AppResponse.success(
                    "Payroll deleted successfully",
                    null
                )
            )
        }
    }

    // Salary Slip Generation Method
    private generateSalarySlips = async (req: FastifyRequest<{Body: ISalarySlipGenerationRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            try {
                const result = await this.payrollService.generateSalarySlips(req.body, request.user);
                res.send(
                    AppResponse.success(
                        "Salary slips generated successfully",
                        result
                    )
                )
            } catch (error) {
                console.error('Error in controller:', error);
                res.status(500).send({
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    data: null
                });
            }
        }
    }

    // Payroll Adjustment Methods
    private addAdjustment = async (req: FastifyRequest<{Body: IManualAdjustmentRequest, Params: {payrollId: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            try {
                const result = await this.adjustmentService.addManualAdjustments(req.params.payrollId, req.body, request.user);
                res.send(
                    AppResponse.success(
                        "Payroll adjustments created successfully",
                        result
                    )
                )
            } catch (error) {
                console.error('Error in controller:', error);
                res.status(500).send({
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    data: null
                });
            }
        }
    }

    private getAdjustmentsByPayroll = async (req: FastifyRequest<{Params: {payrollId: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            try {
                const adjustments = await this.adjustmentService.getAdjustmentsByPayroll(req.params.payrollId, request.user);
                res.send(
                    AppResponse.success(
                        "Payroll adjustments retrieved successfully",
                        adjustments
                    )
                )
            } catch (error) {
                console.error('Error in controller:', error);
                res.status(500).send({
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    data: null
                });
            }
        }
    }

    private deleteAdjustment = async (req: FastifyRequest<{Params: {adjustmentId: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            try {
                const result = await this.adjustmentService.deleteAdjustment(req.params.adjustmentId, request.user);
                res.send(
                    AppResponse.success(
                        "Payroll adjustment deleted successfully",
                        result
                    )
                )
            } catch (error) {
                console.error('Error in controller:', error);
                res.status(500).send({
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    data: null
                });
            }
        }
    }

    // Payroll Approval Method - Admin Only
    private approvePayroll = async (req: FastifyRequest<{Body: IPayrollApprovalRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            try {
                const result = await this.payrollService.approvePayroll(req.body, request.user);
                res.send(
                    AppResponse.success(
                        `Payroll ${req.body.status.toLowerCase()} successfully`,
                        result
                    )
                )
            } catch (error) {
                console.error('Error in payroll approval controller:', error);
                res.status(500).send({
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    data: null
                });
            }
        }
    }
} 