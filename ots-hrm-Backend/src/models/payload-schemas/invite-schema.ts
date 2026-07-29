import z from "zod";
import { InviteRole } from "../enums";
import { multipleEmployeeBenefitsSchema } from "./employee-benefit-schema";

// Create Invite Schema - companyId is optional for super admin
export const createInviteSchema = z.object({
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
            ).optional(),
    // Optional companyId for super admin use case
    companyId: z.string()
        .uuid("Invalid company ID format")
        .optional(),

    // Employee-specific fields (required only when role is EMPLOYEE)
    salary: z.number()
        .positive("Salary must be a positive number")
        .optional(),

    benefits: multipleEmployeeBenefitsSchema
        .optional(),

    departmentId: z.string()
        .uuid("Invalid department ID format")
        .optional()
}).refine(
    (data) => {
        // If role is EMPLOYEE, salary, benefits, and departmentId are required
        if (data.role === InviteRole.EMPLOYEE) {
            return data.salary !== undefined && data.benefits !== undefined && data.departmentId !== undefined;
        }
        return true;
    },
    {
        message: "When role is EMPLOYEE, salary, benefits, and departmentId are required",
        path: ["salary", "benefits", "departmentId"]
    }
);

// Bulk Create Invites Schema
export const bulkCreateInvitesSchema = z.object({
    invites: z.array(createInviteSchema)
        .min(1, "At least one invite is required")
        .max(50, "Maximum 50 invites allowed at once")
});

// Union schema that accepts either single invite or bulk invites
export const createInviteRequestSchema = z.union([
    createInviteSchema,           // Single invite
    bulkCreateInvitesSchema       // Multiple invites
]);

// Resend Invite Schema (for params)
export const resendInviteParamsSchema = z.object({
    id: z.string()
        .uuid("Invalid invite ID format")
        .min(1, "Invite ID is required")
});
