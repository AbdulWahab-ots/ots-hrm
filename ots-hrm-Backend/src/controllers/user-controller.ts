import { inject, injectable } from "tsyringe";
import { ControllerBase } from "./generics/controller-base";
import { UserService } from "../bl";
import { CommonRoutes } from "../constants";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ExtendedRequest, IFetchRequest, IFilter, IGetSingleRecordFilter, ILoginRequest, IUserRequest, ICreateUserRequestBody, IChangePasswordRequest } from "../models";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { hasPermission, requireSelfOr, hasFullSystemAccess } from "../middlewares/permissions";
import { payloadValidator, paramsValidator } from "../middlewares/payload-validator";
import { createUserRequestSchema, getUserByIdParamsSchema, updateUserSchema, toggleUserActiveSchema } from "../models/payload-schemas";
import { changePasswordSchema } from "../models/payload-schemas/auth-schema";
import { AppResponse } from "../utility";

@injectable()
export class UserController extends ControllerBase {
    constructor(@inject('UserService') private readonly userService: UserService){
        super('/user');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: CommonRoutes.create,
                middlewares: [payloadValidator({ body: createUserRequestSchema })],
                handler: this.createUsers as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.getAll,
                handler: this.getAll as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: `${CommonRoutes.getById}/:id`,
                middlewares: [paramsValidator(getUserByIdParamsSchema)],
                handler: this.getById as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: CommonRoutes.getOneByQuery,
                middlewares: [authorize as preHandlerHookHandler],
                handler: this.getOneByQuery as RouteHandlerMethod
            },
            {
                method: 'PUT',
                path: `${CommonRoutes.update}/:id`,
                // IDOR guard: only self-edit, or a super admin editing another user
                // (the "Companies > Admins" screen) - a plain company admin/employee
                // has no legitimate need to edit a different user's account here.
                middlewares: [
                    paramsValidator(getUserByIdParamsSchema),
                    payloadValidator({ body: updateUserSchema }),
                    requireSelfOr(hasFullSystemAccess) as preHandlerHookHandler
                ],
                handler: this.update as RouteHandlerMethod
            },
            {
                method: 'DELETE',
                path: `${CommonRoutes.delete}/:id`,
                middlewares: [paramsValidator(getUserByIdParamsSchema)],
                handler: this.delete as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'secret',
                middlewares: [hasPermission("can_view_secret") as preHandlerHookHandler],
                handler: this.secret as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'exists/email',
                middlewares: [hasPermission('getUser') as preHandlerHookHandler],
                handler: this.checkEmailExists as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'exists/username',
                middlewares: [hasPermission('getUser') as preHandlerHookHandler],
                handler: this.checkUsernameExists as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'change-password',
                middlewares: [payloadValidator({ body: changePasswordSchema })],
                handler: this.changePassword as RouteHandlerMethod
            },
            {
                method: 'PATCH',
                path: 'toggle-active/:id',
                middlewares: [paramsValidator(getUserByIdParamsSchema), payloadValidator({ body: toggleUserActiveSchema })],
                handler: this.toggleActive as RouteHandlerMethod
            }
        ];

    }


    private add = async (req: FastifyRequest<{Body: IUserRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if(request.user){
            res.send(await this.userService.add(req.body, request.user))
        }
    }

    private getAll = async (req: FastifyRequest<{Body?: IFetchRequest<IUserRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        res.send(await this.userService.get(request.user, req.body))
        if(request.user){
        }
    }

    private getById = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(await this.userService.getById(req.params.id, request.user));
        }
    }

    private getOneByQuery = async (req: FastifyRequest<{Body: IGetSingleRecordFilter<IUserRequest>}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(await this.userService.getOne(request.user, req.body));
        }    
    }
 
    private delete = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(await this.userService.delete(req.params.id, request.user));
        }       
    }

    private update = async (req: FastifyRequest<{Body: IUserRequest, Params: {id: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
          res.send(await this.userService.update(req.params.id, req.body, request.user));
        }  
    }

    private secret = async (req: FastifyRequest, res: FastifyReply) => {
        res.send({message: "You have access!"});
    }

    private createUsers = async (req: FastifyRequest<{Body: ICreateUserRequestBody}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            res.send(
                AppResponse.success(
                    'Users created successfully',
                    await this.userService.createUsers(req.body, request.user)
                )
            );
        }
    }

    private checkEmailExists = async (req: FastifyRequest<{Body: {email: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            const exists = await this.userService.existsByEmail(req.body.email);
            res.send(
                AppResponse.success(
                    'Email existence checked successfully',
                    { exists }
                )
            );
        }
    }

    private checkUsernameExists = async (req: FastifyRequest<{Body: {username: string}}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            const exists = await this.userService.existsByUsername(req.body.username);
            res.send(
                AppResponse.success(
                    'Username existence checked successfully',
                    { exists }
                )
            );
        }
    }

    private changePassword = async (req: FastifyRequest<{Body: IChangePasswordRequest}>, res: FastifyReply) => {
        let request = req as ExtendedRequest;

        if (request.user) {
            const { currentPassword, newPassword } = req.body;
            const updatedUser = await this.userService.changePassword(currentPassword, newPassword, request.user);
            res.send(
                AppResponse.success(
                    'Password changed successfully',
                    updatedUser
                )
            );
        }
    }

    private toggleActive = async (req: FastifyRequest<{ Params: { id: string }; Body: { active: boolean } }>, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if (!request.user) return;
        const result = await this.userService.toggleUserActive(req.params.id, req.body.active, request.user);
        res.send(AppResponse.success('User status updated successfully', result));
    }

}