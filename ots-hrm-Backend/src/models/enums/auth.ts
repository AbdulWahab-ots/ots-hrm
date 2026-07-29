
export enum VerificationTypes {
    AccountVerify = 'accountVerify',
    ForgotPassword = 'forgotPassword'
}
// Extract the values for TypeORM and Zod
export const verificationTypeValues = Object.values(VerificationTypes) as [string, ...string[]];


export enum VerificationMethods {
    Email = 'email',
    Phone = 'phone'
}