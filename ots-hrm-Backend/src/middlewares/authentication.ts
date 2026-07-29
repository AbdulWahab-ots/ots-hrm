import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import { container } from 'tsyringe';
import { ExtendedRequest, ITokenUser } from '../models';
import { AppError } from '../utility/app-error';
import { CompanyRepository } from '../dal/company-repository';
import { DefaultRoles } from '../constants';
import { requireSecret } from '../utility/jwt-utility';

config();

export const authorize = (req: ExtendedRequest, res: FastifyReply, done: HookHandlerDoneFunction) => {
  // Extract the token from the request headers, query parameters, or cookies
  let token = req.cookies['auth_token'] ?? req.headers.authorization;
  if(token?.includes("Bearer")) token = token.split(" ")[1];
  if (!token) {
    throw new AppError('Unauthorized Request', '401');
  }

  try {
    // Verify the token. Fail closed if the secret is missing (never fall back to an
    // empty string), and pin the algorithm to prevent algorithm-confusion attacks.
    const decodedToken = jwt.verify(
      token,
      requireSecret(process.env.TOKEN_SECRET_KEY, 'TOKEN_SECRET_KEY'),
      { ignoreExpiration: false, algorithms: ['HS256'] }
    );

    // Attach the decoded user data to the request object
    let user = decodedToken;
    req.user = user as ITokenUser;
    
    if(req.activityLog) req.activityLog.addUserDetails(req.user);

    done();
  } catch (error) {
    res.clearCookie('auth_token',{sameSite: 'lax', secure: true,httpOnly: true, path: '/'})
    throw new AppError('Unauthorized Request', '401');
  }
};

// Validate company ID from header matches user's company (Frontend sends company ID)
export const validateCompanyHeader = async (req: ExtendedRequest, res: FastifyReply) => {
  // Ensure user is authenticated first
  if (!req.user) {
    throw new AppError('User not authenticated', '401');
  }

  // Get company ID from header
  const headerCompanyId = req.headers['company-id'] || req.headers['x-company-id'];

  if (!headerCompanyId) {
    throw new AppError('Company ID header is required', '400');
  }

  const isSuperAdmin = req.user.role === DefaultRoles.SuperAdmin;

  // Non-super-admins may only act within their own company.
  // Super admin manages all companies, so they can target any company.
  if (!isSuperAdmin && req.user.companyId !== headerCompanyId) {
    throw new AppError('Company ID mismatch - Access denied', '403');
  }

  // Check if the (target) company exists and is active
  const companyRepository = container.resolve(CompanyRepository);
  const company = await companyRepository.findOneById(headerCompanyId as string);

  if (!company) {
    throw new AppError('Company not found', '404');
  }

  if (!company.active) {
    throw new AppError('Your company is not active. Please contact your admin.', '403');
  }

  // For a super admin acting on another company ("behind the curtain"), adopt the
  // requested company as the effective context so the per-company scoping in the
  // services operates on it. No-op when it's already their own company.
  if (isSuperAdmin) {
    req.user.companyId = headerCompanyId as string;
  }
};
