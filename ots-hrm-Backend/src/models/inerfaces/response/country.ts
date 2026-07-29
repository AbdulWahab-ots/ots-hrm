// models/country-response.interface.ts

import { IResponseBase } from "./response-base";

export interface ICountryResponse extends IResponseBase {
    name: string;
    code: string;
    iso2: string;
    capital?: string;
    continent?: string;
    currency?: string;
    phone?: string;
}


// only get id name and code
export interface ICountryMinimalResponse {
    id: string;
    name: string;
    code: string;
}