// utils/AppError.ts
export class AppError extends Error {
  code: string;
  stack?: string;
  errors?: { field: string; message: string }[];

  constructor(message: string, code: string, errors?: { field: string; message: string }[], stack?: string) {
    super(message);
    this.code = code;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
