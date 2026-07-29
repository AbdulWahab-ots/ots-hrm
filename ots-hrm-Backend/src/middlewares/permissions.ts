import { FastifyReply, FastifyRequest } from 'fastify';
import {FullSystemAccessPrivileges} from '../constants/privileges';
import { DefaultRoles } from '../constants/roles';
import { ITokenUser } from '../models';

// Single source of truth for "is this user an admin". A user qualifies if they hold
// full system access (super admin) or carry the admin/super admin role. Used both by
// the requireAdminAccess preHandler and by services that scope reads by role.
export function hasAdminAccess(user?: Pick<ITokenUser, 'role' | 'privileges'> | null): boolean {
    if (!user || !Array.isArray(user.privileges)) return false;
    if (user.privileges.includes(FullSystemAccessPrivileges.code)) return true;
    return user.role === DefaultRoles.Admin || user.role === DefaultRoles.SuperAdmin;
}

export function hasPermission(...requiredPermissions: string[]){
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const user = (req as any).user;

        // Checking if privilege exists
        if(!user || !Array.isArray(user.privileges)) {
            reply.status(403).send({message : "Forbidden. No privilege assigned."});
            return;
        }

        // Grant access if user has full system access
        if (user.privileges.includes(FullSystemAccessPrivileges.code)) {
            return; // access granted
        }

        // Checking if there is at least one permission
        const hasPermission = requiredPermissions.some((perm) => 
            user.privileges.includes(perm)
        );

        if(!hasPermission){
            reply.status(403).send({message : "Forbidden. Insufficient permissions."});
        }
    };
}

export function requireAdminAccess(){
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const user = (req as any).user;

        // Check if user exists
        if(!user) {
            reply.status(403).send({message : "Forbidden. User not authenticated."});
            return;
        }

        if (hasAdminAccess(user)) {
            return; // access granted
        }

        // Deny access for all other roles
        reply.status(403).send({message : "Forbidden. Admin access required."});
    };
}
