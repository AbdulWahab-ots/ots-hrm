import z, { date } from "zod";
import { verificationTypeValues } from "../enums";



export const signUpSchema = z.object({
    userName: z.string().min(2).max(20),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8).max(100),
    firstName: z.string().min(2).max(100),
    middleName: z.string().optional(),
    lastName: z.string().min(2).max(100),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
    temporaryAddress: z.string().optional(),
    dateOfBirth: z.string().optional(),

});
export const loginSchema = z.object({
    userName: z.string().min(2).max(100),
    password: z.string().min(8).max(100),
});

export const verifySchema = z.object({
    userId: z.string().uuid(),
    whichPurpose: z.enum(verificationTypeValues , {
        errorMap: () => ({ message: "Type must be either 'accountVerify' or 'forgotPassword'" })
    }),
    code: z.string().min(6).max(6),
});

export const resendCodeSchema = z.object({
    email: z.string().email("Invalid email format"),
    whichPurpose: z.enum(verificationTypeValues , {
        errorMap: () => ({ message: "Type must be either 'accountVerify' or 'forgotPassword'" })
    }),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format")
});

export const resetPasswordSchema = z.object({
    userId: z.string(),
    code: z.string().min(6).max(6),
    newPassword: z.string().min(8).max(100),
});

export const validateInviteTokenSchema = z.object({
    token: z.string()
});

export const inviteSignUpSchema = z.object({
    inviteToken: z.string(),
    userName: z.string().min(2).max(20),
    password: z.string().min(8).max(100),
    firstName: z.string().min(2).max(100),
    middleName: z.string().optional(),
    lastName: z.string().min(2).max(100),
    dateOfBirth: z.string().optional(),
    phoneNumber: z.string().optional(),
    pictureUrl: z.string().optional()
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100)
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character"
        )
}).refine(
    (data) => data.currentPassword !== data.newPassword,
    {
        message: "New password must be different from current password",
        path: ["newPassword"]
    }
);
