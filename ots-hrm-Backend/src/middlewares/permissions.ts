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

// Narrower than hasAdminAccess() - true only for super admin (or full-system-access
// privilege), not a company admin. Used to gate cross-user actions that only the
// super-admin "Companies > Admins" screen legitimately needs (e.g. editing a
// different company's admin user record) - a company admin has no equivalent need
// to edit an arbitrary OTHER user's account directly.
export function hasFullSystemAccess(user?: Pick<ITokenUser, 'role' | 'privileges'> | null): boolean {
    if (!user || !Array.isArray(user.privileges)) return false;
    if (user.privileges.includes(FullSystemAccessPrivileges.code)) return true;
    return user.role === DefaultRoles.SuperAdmin;
}

// Guards a route whose :id param names the user being acted on (e.g. PUT
// /user/update/:id). Allows the request through only if the caller is acting on
// their OWN account, or passes `check` (e.g. hasFullSystemAccess for
// super-admin-only cross-user actions, hasAdminAccess for admin-or-above ones) -
// otherwise it's an IDOR: any authenticated user could act on any other user's
// account just by changing the :id in the URL.
export function requireSelfOr(
    check: (user?: Pick<ITokenUser, 'role' | 'privileges'> | null) => boolean,
    idParam: string = 'id'
) {
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const user = (req as any).user;
        if (!user) {
            reply.status(403).send({ message: "Forbidden. User not authenticated." });
            return;
        }

        const targetId = (req.params as Record<string, string>)[idParam];
        if (targetId === user.id || check(user)) {
            return; // access granted
        }

        reply.status(403).send({ message: "Forbidden. You can only do this for your own account." });
    };
}
