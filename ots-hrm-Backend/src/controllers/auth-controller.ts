import { injectable, inject } from "tsyringe";
import { ControllerBase } from "./generics/controller-base";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { AuthService } from "../bl";
import { AppResponse } from "../utility";
import { ExtendedRequest, ILoginRequest, ISignUpRequest, IResendCodeRequest, IForgotPasswordRequest, IResetPasswordRequest, IVerifyRequest, IInviteSignUpRequest, IValidateInviteTokenRequest, ISetPasswordRequest } from "../models";
import { signUpSchema, resendCodeSchema, verifySchema, loginSchema, resetPasswordSchema, forgotPasswordSchema, validateInviteTokenSchema, inviteSignUpSchema, setPasswordSchema } from "../models/payload-schemas/index";
import { authorize, validateCompanyHeader } from "../middlewares";
import { payloadValidator, bodyValidator, queryValidator } from "../middlewares/payload-validator";

@injectable()
export class AuthController extends ControllerBase {
    constructor(
        @inject('AuthService') private readonly authService: AuthService,
    ) {
        super('/auth');
        this.endPoints = [
            {
                method: 'POST',
                path: 'login',
                middlewares: [bodyValidator(loginSchema)],
                config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
                handler: this.login as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'signup',
                middlewares: [bodyValidator(signUpSchema)],
                config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
                handler: this.signUp as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'profile',
                middlewares: [authorize, validateCompanyHeader] as preHandlerHookHandler[],
                handler: this.getCurrentProfile as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'logout',
                handler: this.logout as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'verify',
                middlewares: [queryValidator(verifySchema)],
                config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
                handler: this.verify as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'resend-code',
                middlewares: [queryValidator(resendCodeSchema)],
                config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
                handler: this.resendCode as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'forgot-password',
                middlewares: [queryValidator(forgotPasswordSchema)],
                config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
                handler: this.forgotPassword as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'reset-password',
                middlewares: [bodyValidator(resetPasswordSchema)],
                config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
                handler: this.resetPassword as RouteHandlerMethod
            },
            {
                method: 'GET',
                path: 'validate-invite-token',
                middlewares: [queryValidator(validateInviteTokenSchema)],
                handler: this.validateInviteToken as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'signup-with-invite',
                middlewares: [bodyValidator(inviteSignUpSchema)],
                handler: this.signUpWithInvite as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: 'set-password',
                middlewares: [bodyValidator(setPasswordSchema)],
                config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
                handler: this.setPassword as RouteHandlerMethod
            }
        ];
    }

    private login = async (req: FastifyRequest<{Body: ILoginRequest}>, res: FastifyReply) => {
        let { token, ...rest} = await this.authService.login(req.body);
        res.setCookie('auth_token', token, {
            httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
            secure: true, // Only send the cookie over HTTPS in production
            maxAge: 60 * 60 * 24, // Cookie expiration time in seconds (e.g., 1 day)
            path: '/', // Cookie is accessible across the entire site
            sameSite: 'lax', // Prevent the cookie from being sent with cross-site requests
        });
        res.send({ ...AppResponse.success('Login successful', {...rest, token}), access_token: token }); // access_token kept at top level for the frontend's Bearer-token flow (lib/api.ts reads user?.access_token)
    }

    private signUp = async (req: FastifyRequest<{Body: ISignUpRequest}>, res: FastifyReply) => {
        let {token, ...rest} = await this.authService.signUp(req.body);
        res.setCookie('auth_token', token, {
            httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
            secure: true, // Only send the cookie over HTTPS in production
            maxAge: 60 * 60 * 24, // Cookie expiration time in seconds (e.g., 1 day)
            path: '/', // Cookie is accessible across the entire site
            sameSite: 'lax', // Prevent the cookie from being sent with cross-site requests
        });
        res.send({ ...AppResponse.success('Sign up successful', { ...rest, token }), access_token: token }); // access_token kept at top level for the frontend's Bearer-token flow (lib/api.ts reads user?.access_token)
    }

    private getCurrentProfile = async (req: FastifyRequest, res: FastifyReply) => {
        let {user} = req as ExtendedRequest;

        if(user){
            let currentUser = await this.authService.getCurrentProfile(user.id);
            res.send(AppResponse.success('User profile retrieved successfully', currentUser));
        }else{
            res.status(404).send(AppResponse.error('User Not found'));
        }
    }

    private logout = async (req: FastifyRequest, res: FastifyReply) => {
        res.clearCookie('auth_token',{sameSite: 'lax', secure: true, httpOnly: true, path: '/'})
        res.send(AppResponse.success('Logged out successfully'));
        }

    private resendCode = async (req: FastifyRequest<{ Querystring: IResendCodeRequest }>, res: FastifyReply) => {
        let user = await this.authService.resendCode(req.query);
        res.send(AppResponse.success('Verification code resent successfully', user));
    }

    private verify = async (req: FastifyRequest<{ Querystring: IVerifyRequest }>, res: FastifyReply) => {
        let verification = await this.authService.verify(req.query);
        res.send(AppResponse.success('Verification code verified successfully', verification));
    }

    private forgotPassword = async (req: FastifyRequest<{ Querystring: IForgotPasswordRequest }>, res: FastifyReply) => {
        let user = await this.authService.forgotPassword(req.query);
        res.send(AppResponse.success('Password reset code sent successfully', user));
    }

    private resetPassword = async (req: FastifyRequest<{ Body: IResetPasswordRequest }>, res: FastifyReply) => {
        let user = await this.authService.resetPassword(req.body);
        res.clearCookie('auth_token', { sameSite: 'lax', secure: true, httpOnly: true, path: '/' });
        res.send(AppResponse.success('Password reset successfully', user));
    }

    private validateInviteToken = async (req: FastifyRequest<{ Querystring: IValidateInviteTokenRequest }>, res: FastifyReply) => {
        const validation = await this.authService.validateInviteToken(req.query.token);
        res.send(AppResponse.success('Invite token validation result', validation));
    }

    private setPassword = async (req: FastifyRequest<{ Body: ISetPasswordRequest }>, res: FastifyReply) => {
        const user = await this.authService.setPasswordViaToken(req.body.token, req.body.newPassword);
        res.send(AppResponse.success('Password set successfully', user));
    }

    private signUpWithInvite = async (req: FastifyRequest<{ Body: IInviteSignUpRequest }>, res: FastifyReply) => {
        let { token, ...rest } = await this.authService.signUpWithInvite(req.body);
        res.setCookie('auth_token', token, {
            httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
            secure: true, // Only send the cookie over HTTPS in production
            maxAge: 60 * 60 * 24, // Cookie expiration time in seconds (e.g., 1 day)
            path: '/', // Cookie is accessible across the entire site
            sameSite: 'lax', // Prevent the cookie from being sent with cross-site requests
        });
        res.send(AppResponse.success('Invite-based signup successful', { ...rest, token }));
    }
}