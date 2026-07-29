import { FastifyReply, HookHandlerDoneFunction } from "fastify";
import { ExtendedRequest } from "../models";
import { ActivityLog } from "../entities";

export const logger = (req: ExtendedRequest, res: FastifyReply, done: HookHandlerDoneFunction) => {
    req.activityLog = new ActivityLog().logStart(req.url, req.method, req);
    done();
};
