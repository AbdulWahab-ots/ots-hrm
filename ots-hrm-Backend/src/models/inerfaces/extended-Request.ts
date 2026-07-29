import { FastifyRequest } from "fastify";
import { ITokenUser } from "./tokenUser";
import { ActivityLog } from "../../entities";

export type ExtendedRequest<TParams = {}, TBody = {}, TQuery = {}> = FastifyRequest<{Params: TParams; Body: TBody; Querystring: TQuery}> & {user?: ITokenUser; activityLog?:ActivityLog};