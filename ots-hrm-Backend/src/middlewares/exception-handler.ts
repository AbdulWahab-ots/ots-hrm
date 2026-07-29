import { FastifyReply, FastifyError, FastifyRequest } from "fastify";
import { ExtendedRequest } from "../models";
import { log, error } from "console";
import { QueryFailedError } from "typeorm";
import { parseDbError } from "../utility/db-error";
import { AppResponse } from "../utility/app-response";

export const errorHandler = async (
  err: FastifyError,
  req: ExtendedRequest | FastifyRequest,
  reply: FastifyReply
) => {
  const request = req as ExtendedRequest;

  // Prefer the framework-provided numeric status (Fastify validation/multipart errors set
  // err.statusCode but a string err.code like "FST_ERR_VALIDATION"). Fall back to AppError's
  // numeric-string code, then 500.
  const codeStatus = typeof err.code === 'string' && /^\d+$/.test(err.code) ? parseInt(err.code) : undefined;
  let statusCode = (err as any).statusCode ?? codeStatus ?? 500;
  let message = err.message || 'Internal Server Error';
  let errors = (err as any)?.errors;

  if (err instanceof QueryFailedError) {
    const parsed = parseDbError(err);
    statusCode = parsed.statusCode;
    message = parsed.message;
  }

  // Guard against an invalid status (e.g. NaN) reaching reply.status().
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  if (request.activityLog) {
    await request.activityLog.logEnd('error', JSON.stringify({
      code: statusCode,
      message,
      errors,
      stack: err.stack
    }));
    request.activityLog = undefined;
  }

  error('❌ Global Error:', err);

  reply.status(statusCode).send(
    AppResponse.error(
      message,
      process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      errors
    )
  );
};
