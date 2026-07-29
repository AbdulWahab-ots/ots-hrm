import { IResponseBase } from "./response-base";

export interface IVerificationResponse extends IResponseBase {
    target: string; // email or phone number
    code: string; // OTP or verification code
    type: 'email' | 'phone';
    verified: boolean;
    expiresAt: Date;
    userId?: string;
}