import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import {container} from 'tsyringe'
import { registerRepositories } from "../dal/register/repositories-register";
import { registerServices } from "../bl/register/services-register";
import { logger } from "../middlewares";
import { ExtendedRequest } from "../models";
import { ActivityLog } from "../entities";
import { registerControllers } from "../controllers/register/controllers-register";
import { AppResponse } from "./app-response";
import { getAllowedOrigins } from "./cors-utility";

export const fastifyRegisters = async (fastify: FastifyInstance) => {
    // Restrict CORS to an explicit allowlist. With credentials enabled, reflecting
    // arbitrary origins (origin:true) lets any website make authenticated cross-origin
    // calls, so the allowed origins come from env (CORS_ORIGINS, comma-separated) and
    // fall back to FRONTEND_URL / the local dev frontend. Shared with the Socket.IO
    // server (socket/socket-io.ts) so the two allowlists never drift apart.
    const allowedOrigins = getAllowedOrigins();

    await fastify.register(cors, {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'company-id', 'x-company-id']
    });

    // Register rate limiting with global:false so it does NOT throttle the app at large
    // (the frontend can burst freely). Only routes that opt in via `config.rateLimit`
    // are limited — currently the sensitive auth routes — to stop credential / OTP
    // brute-forcing without affecting normal API traffic.
    await fastify.register(rateLimit, { global: false });
    registerRepositories(container);
    registerServices(container);
    fastify.addHook('onResponse', async (req: FastifyRequest, res: FastifyReply) => {
        const request = req as ExtendedRequest;
        if(request.activityLog) {
            await request.activityLog?.logEnd('success');
        };
    });
    fastify.setNotFoundHandler(async (req, reply) => {
        const request = req as ExtendedRequest;
        request.activityLog = new ActivityLog().logStart(request.url, request.method, request);
        if(request.activityLog) await request.activityLog.logEnd('error', JSON.stringify({code: 404, message: 'Route not found'}));
        request.activityLog = undefined;
        reply.status(404).send(AppResponse.error(`Route: ${request.originalUrl} not found`, '404'));
    });

    const controllers = registerControllers(container)
    await fastify.register((fi: FastifyInstance, options: FastifyPluginOptions, done) => {
        fi.addHook('onRequest', logger as preHandlerHookHandler)
        Object.values(controllers).forEach((controller) => {
            controller.getRouter(fi);
        })
        done();
    }, {prefix: '/api'});
}