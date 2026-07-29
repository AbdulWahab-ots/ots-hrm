import { injectable } from "tsyringe";
import { FastifyReply, FastifyRequest, RouteHandlerMethod } from "fastify";
import { ControllerBase } from "./generics/controller-base";

@injectable()
export class HookController extends ControllerBase {
    constructor() {
        super("/hook");

        this.endPoints = [
            {
                method: "POST",
                path: "attendance",
                handler: this.receiveAttendance as RouteHandlerMethod
            }
        ];
    }

    private receiveAttendance = async (req: FastifyRequest, res: FastifyReply) => {
        try {
            const payload = req.body as {
                event: string; // e.g., "check-in" or "check-out"
                user_id: string;
                timestamp: string;
            };

            console.log("📥 Attendance Payload Received:", payload);

            res.send({
                success: true,
                message: "Attendance received",
                data: payload
            });

        } catch (err) {
            console.error("❌ Error parsing attendance:", err);
            res.status(400).send({
                success: false,
                message: "Invalid payload"
            });
        }
    };
}
