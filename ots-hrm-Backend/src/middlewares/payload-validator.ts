import { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { ZodSchema } from 'zod';
import { ActivityLog } from "../entities";
import { ExtendedRequest } from '../models';
import { AppError } from '../utility/app-error';

type ValidationType = 'body' | 'query' | 'params';

interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

type FieldError = { field: string; message: string; type: ValidationType };
type ValidationOutcome = { errors: FieldError[]; data?: unknown };

// Helper function to validate a single field type with enhanced error handling.
// On success it also returns the parsed data, which zod strips of any keys not
// declared in the schema — the caller reassigns this back onto the request so
// unknown/extra fields can never reach the persistence layer (mass-assignment).
const validateField = async (
  schema: ZodSchema,
  data: any,
  type: ValidationType
): Promise<ValidationOutcome> => {
  // Check if data is undefined/null for body validation
  if (type === 'body' && (data === undefined || data === null)) {
    return { errors: [{
      field: 'root',
      message: 'Request body is missing or empty',
      type
    }] };
  }

  const parsed = await schema.safeParseAsync(data);

  if (!parsed.success) {
    return { errors: parsed.error.errors.map(err => {
      // Enhanced error field handling
      const fieldPath = err.path.length > 0 ? err.path.join('.') : 'root';

      // Enhanced error message
      let message = err.message;
      if (err.code === 'invalid_type') {
        message = `Expected ${err.expected}, but received ${err.received}`;
      }

      return {
        field: fieldPath,
        message: message,
        type
      };
    }) };
  }

  return { errors: [], data: parsed.data };
};

// Enhanced validator that can handle body, query, and params
export const payloadValidator = (config: ValidationConfig | ZodSchema): preHandlerHookHandler => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    let validationConfig: ValidationConfig;
    
    // Handle backward compatibility - if ZodSchema is passed directly, treat as body validation
    if ('_def' in config) {
      validationConfig = { body: config as ZodSchema };
    } else {
      validationConfig = config as ValidationConfig;
    }

    // Validate each configured location, capturing the parsed (key-stripped) result.
    const bodyOutcome = validationConfig.body
      ? await validateField(validationConfig.body, req.body, 'body')
      : undefined;
    const queryOutcome = validationConfig.query
      ? await validateField(validationConfig.query, req.query, 'query')
      : undefined;
    const paramsOutcome = validationConfig.params
      ? await validateField(validationConfig.params, req.params, 'params')
      : undefined;

    const errors = [
      ...(bodyOutcome?.errors ?? []),
      ...(queryOutcome?.errors ?? []),
      ...(paramsOutcome?.errors ?? []),
    ];

    // If there are any validation errors, handle them
    if (errors.length > 0) {
      // Enhanced error logging
      console.error('Validation errors:', errors);
      
      const request = req as ExtendedRequest;
      if (request.activityLog) {
        await request.activityLog.logEnd('error', JSON.stringify({
          code: 400,
          message: 'Validation Failed',
          errors
        }));
        request.activityLog = undefined;
      }

      throw new AppError('Validation Failed', '400', errors);
    }

    // Replace the request body with the parsed, key-stripped version so that any
    // property not declared in the schema is dropped before it reaches the
    // service/repository layer. This closes the mass-assignment vector where
    // fields like passwordHash / active / companyId could be smuggled in.
    if (bodyOutcome && bodyOutcome.data !== undefined) {
      req.body = bodyOutcome.data;
    }
  };
};

// Convenience functions for single-type validation
export const bodyValidator = (zodSchema: ZodSchema): preHandlerHookHandler => 
  payloadValidator({ body: zodSchema });

export const queryValidator = (zodSchema: ZodSchema): preHandlerHookHandler => 
  payloadValidator({ query: zodSchema });

export const paramsValidator = (zodSchema: ZodSchema): preHandlerHookHandler => 
  payloadValidator({ params: zodSchema });