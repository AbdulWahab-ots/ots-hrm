import z from "zod";
import { Gender } from "../enums";
import { InviteRole } from "../enums";

// Default User Schema
const defaultUserSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must be at most 50 characters"),
    email: z.string()
        .email("Invalid email format")
        .min(5, "Email must be at least 5 characters")
        .max(255, "Email must be at most 255 characters"),
    password: z.string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must be at most 100 characters")
});

// Invite Schema for company creation
const companyInviteSchema = z.object({
    email: z.string()
        .email("Invalid email format")
        .min(5, "Email must be at least 5 characters")
        .max(255, "Email must be at most 255 characters"),
    role: z.string()
        .refine(
            (val) => Object.values(InviteRole).includes(val as InviteRole),
            {
                message: `Invalid role. Must be one of: ${Object.values(InviteRole).join(', ')}`,
            }
        )
        .optional()
});

// Company Creation Schema
export const createCompanySchema = z.object({
    name: z.string()
        .min(1, "Company name is required")
        .max(100, "Company name must be at most 100 characters"),
    email: z.string()
        .email("Invalid email format")
        .min(5, "Email must be at least 5 characters")
        .max(255, "Email must be at most 255 characters"),
    phoneNo: z.string()
        .max(20, "Phone number must be at most 20 characters")
        .optional(),
    address: z.string()
        .max(500, "Address must be at most 500 characters")
        .optional(),
    temporaryAddress: z.string()
        .max(500, "Temporary address must be at most 500 characters")
        .optional(),
    zipCode: z.number()
        .int("Zip code must be an integer")
        .positive("Zip code must be positive")
        .optional(),
    country: z.string()
        .max(100, "Country must be at most 100 characters")
        .optional(),
    state: z.string()
        .max(100, "State must be at most 100 characters")
        .optional(),
    city: z.string()
        .max(100, "City must be at most 100 characters")
        .optional(),
    defaultUser: z.array(defaultUserSchema)
        .min(1, "At least one default user is required if provided")
        .max(10, "Maximum 10 default users allowed")
        .optional(),
    invites: z.array(companyInviteSchema)
        .min(1, "At least one invite is required if provided")
        .max(50, "Maximum 50 invites allowed")
        .optional()
}).refine(
    (data) => {
        // At least one of defaultUser or invites must be provided
        return (data.defaultUser && data.defaultUser.length > 0) || 
               (data.invites && data.invites.length > 0);
    },
    {
        message: "At least one of defaultUser or invites must be provided",
        path: ["defaultUser", "invites"]
    }
); 