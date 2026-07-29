import 'fastify';
import { ITokenUser } from '../models';
import { ActivityLog } from '../entities';

declare module 'fastify' {
  interface FastifyRequest {
    user?: ITokenUser; // Replace `any` with the actual type if you have a specific type for the token user
    activityLog?: ActivityLog;
  }
}