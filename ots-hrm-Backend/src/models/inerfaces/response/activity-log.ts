import { IResponseBase } from "./response-base";

export interface IActivityLogResponse extends IResponseBase {
  logDetail: string;
  url: string;
  model: string;
  method: "get" | "put" | "delete" | "post" | string;
  status: "success" | "error";
  platform?: string;
  language?: string;
  ipAddress?: string;
  companyId?: string;
  params?: Record<string, any>;
  queryParams?: Record<string, any>;
  body?: any;
  headers?: Record<string, any>;
  errorDetail?: string;
}
