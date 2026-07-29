import { IResponseBase } from "./response-base";

// Interface for enum item response
export interface IEnumItem {
    key: string | number;
    value: string;
}

// Dynamic response type
export type IDynamicEnumResponse = Record<string, IEnumItem[]>;

export interface IMasterEnumResponse extends IResponseBase {
    moduleType: string;
    enumKey: string;
    enumValue: string;
    description?: string;
    sortOrder: number;
}
