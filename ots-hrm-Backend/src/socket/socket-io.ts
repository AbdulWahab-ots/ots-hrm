import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { ITokenUser } from '../models';
import { hasAdminAccess } from '../middlewares/permissions';
import { requireSecret } from '../utility/jwt-utility';
import { getAllowedOrigins } from '../utility/cors-utility';

// Socket.IO's 4th generic param is per-socket data (here: the authenticated user,
// attached in the handshake middleware below).
type SocketData = { user: ITokenUser };
type AppServer = Server<any, any, any, SocketData>;

// Room an admin dashboard viewing the company's attendance records joins.
export const adminAttendanceRoom = (companyId: string): string => `company:${companyId}:admin-attendance`;

// Room a specific employee's own attendance page joins.
export const employeeAttendanceRoom = (userId: string): string => `user:${userId}:attendance`;

export function initializeSocket(httpServer: HTTPServer): AppServer {
    const io: AppServer = new Server(httpServer, {
        cors: {
            origin: getAllowedOrigins(),
            credentials: true
        }
    });

    // Same JWT the HTTP API uses (see middlewares/authentication.ts's authorize()) -
    // passed via the client's `auth: { token }` handshake option, since a plain
    // WebSocket handshake can't carry an Authorization header the way axios calls do.
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token as string | undefined;
            if (!token) throw new Error('Unauthorized');

            const decoded = jwt.verify(
                token,
                requireSecret(process.env.TOKEN_SECRET_KEY, 'TOKEN_SECRET_KEY'),
                { ignoreExpiration: false, algorithms: ['HS256'] }
            ) as ITokenUser;

            socket.data.user = decoded;
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.data.user;

        // Every connected user gets their own updates (the employee's own attendance
        // page); an admin additionally gets every update across the company (the
        // Attendance Records page).
        socket.join(employeeAttendanceRoom(user.id));
        if (hasAdminAccess(user)) {
            socket.join(adminAttendanceRoom(user.companyId));
        }

        socket.on('disconnect', () => {
            // Socket.IO leaves all rooms automatically on disconnect - nothing to clean up.
        });
    });

    return io;
}

// Emits one employee's changed attendance record to both the company's admin room
// and that employee's own room. Called only for records the sync job actually
// changed (see AttendanceService.upsertBiometricAttendance's `changed` flag) -
// never on every poll tick, so connected clients aren't spammed with no-op updates.
export function emitAttendanceUpdate(
    io: AppServer,
    companyId: string,
    userId: string,
    payload: unknown
): void {
    io.to(adminAttendanceRoom(companyId)).to(employeeAttendanceRoom(userId)).emit('attendance:update', payload);
}
