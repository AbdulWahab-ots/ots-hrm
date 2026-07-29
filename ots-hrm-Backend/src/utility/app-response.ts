export interface ApiSuccess<T> {
  success: true;
  message: string;
  result?: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];  // ✅ Added
  stack?: string;
}

export class AppResponse {
  static success(message: string, result: any = null): ApiSuccess<any> {
    return {
      success: true,
      message,
      result
    };
  }

  static error(message: string, stack?: string, errors?: { field: string; message: string }[]): ApiError {
    return {
      success: false,
      message,
      ...(errors ? { errors } : {}),
      ...(stack ? { stack } : {})
    };
  }
}

