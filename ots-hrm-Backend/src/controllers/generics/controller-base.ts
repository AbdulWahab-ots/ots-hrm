import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest, HookHandlerDoneFunction, preHandlerHookHandler } from "fastify";
import { injectable } from "tsyringe";
import { APIEndpoints } from "../../models";
import { log } from "console";

@injectable()
export class ControllerBase {
  controllerPath!: string;
  public endPoints: APIEndpoints = [];
  middleware?: preHandlerHookHandler | preHandlerHookHandler[]; // Support both single and array

  constructor (path: string) {
    this.controllerPath = path;

  }
  getRouter = (fastify: FastifyInstance) => {
    fastify.register(
      (controller: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
        // Handle multiple middlewares
        if(this.middleware) {
          if(Array.isArray(this.middleware)) {
            // Multiple middlewares
            this.middleware.forEach(middleware => {
              controller.addHook('preHandler', middleware);
            });
          } else {
            // Single middleware
            controller.addHook('preHandler', this.middleware);
          }
        }
        
        for (const ep of this.endPoints) {
          // Per-route options; `config` carries things like per-route rateLimit overrides.
          const routeOptions = { preHandler: ep.middlewares, config: ep.config };
          switch (ep.method) {
            case "GET":
              controller.get(`/${ep.path}`, routeOptions, ep.handler);
              break;
            case "PUT":
              controller.put(`/${ep.path}`, routeOptions, ep.handler);
              break;
            case "POST":
              controller.post(`/${ep.path}`, routeOptions, ep.handler);
              break;
            case "DELETE":
              controller.delete(`/${ep.path}`, routeOptions, ep.handler);
              break;
            case "PATCH":
              controller.patch(`/${ep.path}`, routeOptions, ep.handler);
              break;
            case "OPTIONS":
              controller.options(`/${ep.path}`, routeOptions, ep.handler);
              break;
            default:
              break;
          }
        }

        done();
      },
      { prefix: this.controllerPath }
    );
  };
}
