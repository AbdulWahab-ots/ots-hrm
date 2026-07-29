import { ICompanyResponseBase } from "./response-base";

export interface IApiKeyResponse extends  ICompanyResponseBase {
    apiKey: string;
    usage: number;
}