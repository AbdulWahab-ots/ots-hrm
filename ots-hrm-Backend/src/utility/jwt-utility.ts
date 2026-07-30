import { sign, verify, SignOptions } from "jsonwebtoken";
import { ITokenUser } from "../models";

// Require the signing secret rather than falling back to an empty/guessable value,
// so the service fails closed instead of issuing/accepting tokens signed with a weak key.
export const requireSecret = (value: string | undefined | null, name: string): string => {
    if (!value) throw new Error(`${name} is not configured`);
    return value;
};

export const signJwt = (user: ITokenUser, tokenSecret: string | null = null, expiryTime?: {unit: 'Hours' | 'Days' | 'Months' | 'Seconds' | 'Minutes', amount: number}): string => {
    return sign(user, requireSecret(tokenSecret ?? process.env.TOKEN_SECRET_KEY, 'TOKEN_SECRET_KEY') , { algorithm: 'HS256', expiresIn: expiryTime ? `${expiryTime.amount} ${expiryTime.unit}` : '10 days' } as SignOptions);
}

export const verifyJwt = (jwt: string, tokenSecret: string | null = null, ignoreExpiration: boolean = false): boolean => {
    // Pin the accepted algorithm to prevent algorithm-confusion / alg:none attacks.
    let user = verify(jwt, requireSecret(tokenSecret ?? process.env.TOKEN_SECRET_KEY, 'TOKEN_SECRET_KEY'), { algorithms: ['HS256'], ignoreExpiration });
    if (!user) return false;
    return true;
}

// Invite JWT functions
export const generateInviteToken = (payload: {
    email: string;
    role: string;
    companyId: string;
    inviteId: string;
    createdBy?: string;
    salary?: number;
    benefits?: any[];
    departmentId?: string;
}): string => {
    const tokenPayload = {
        ...payload,
        type: 'invite'
    };
    
    return sign(
        tokenPayload,
        requireSecret(process.env.INVITE_TOKEN_SECRET_KEY, 'INVITE_TOKEN_SECRET_KEY'),
        {
            expiresIn: '7d',
            issuer: 'hrm-system',
            audience: 'invite-acceptance'
        }
    );
};

export const verifyInviteToken = (token: string): any => {
    return verify(
        token,
        requireSecret(process.env.INVITE_TOKEN_SECRET_KEY, 'INVITE_TOKEN_SECRET_KEY'),
        {
            issuer: 'hrm-system',
            audience: 'invite-acceptance'
        }
    );
};

// Set-password JWT functions — used for the "set your password" link an Employee
// receives by email after an Admin creates their account, and reuses the same
// signing secret/style as the invite token above.
export const generateSetPasswordToken = (payload: { userId: string; email: string }): string => {
    const tokenPayload = {
        ...payload,
        type: 'set-password'
    };

    return sign(
        tokenPayload,
        requireSecret(process.env.INVITE_TOKEN_SECRET_KEY, 'INVITE_TOKEN_SECRET_KEY'),
        {
            expiresIn: '3d',
            issuer: 'hrm-system',
            audience: 'set-password'
        }
    );
};

export const verifySetPasswordToken = (token: string): any => {
    return verify(
        token,
        requireSecret(process.env.INVITE_TOKEN_SECRET_KEY, 'INVITE_TOKEN_SECRET_KEY'),
        {
            issuer: 'hrm-system',
            audience: 'set-password'
        }
    );
};