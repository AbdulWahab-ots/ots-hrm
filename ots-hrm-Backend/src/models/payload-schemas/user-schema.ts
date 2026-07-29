import z from "zod";
import { Gender, UserRole } from "../enums";

// Create User Schema
export const createUserSchema = z.object({
    userName: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must be at most 50 characters")
        .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, hyphens, and underscores"),

    email: z.string()
        .email("Invalid email format")
        .min(5, "Email must be at least 5 characters")
        .max(255, "Email must be at most 255 characters"),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character"
        ),

    firstName: z.string()
        .min(1, "First name is required")
        .max(100, "First name must be at most 100 characters")
        .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),

    lastName: z.string()
        .min(1, "Last name is required")
        .max(100, "Last name must be at most 100 characters")
        .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),

    role: z.string()
        .refine(
            (val) => Object.values(UserRole).includes(val as UserRole),
            {
                message: `Invalid user role. Must be one of: ${Object.values(UserRole).join(', ')}`,
            }
        ).optional(),

    // Optional companyId for super admin use case
    companyId: z.string()
        .uuid("Invalid company ID format")
        .optional(),
});

// Bulk Create Users Schema
export const bulkCreateUsersSchema = z.object({
    users: z.array(createUserSchema)
        .min(1, "At least one user is required")
        .max(20, "Maximum 20 users allowed at once")
});

// Union schema that accepts either single user or bulk users
export const createUserRequestSchema = z.union([
    createUserSchema,           // Single user
    bulkCreateUsersSchema       // Multiple users
]);

// Update User Schema (for existing user updates)
export const updateUserSchema = z.object({
    userName: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must be at most 50 characters")
        .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, hyphens, and underscores")
        .optional(),

    email: z.string()
        .email("Invalid email format")
        .min(5, "Email must be at least 5 characters")
        .max(255, "Email must be at most 255 characters")
        .optional(),

    firstName: z.string()
        .min(1, "First name is required")
        .max(100, "First name must be at most 100 characters")
        .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces")
        .optional(),

    lastName: z.string()
        .min(1, "Last name is required")
        .max(100, "Last name must be at most 100 characters")
        .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces")
        .optional(),

    middleName: z.string()
        .max(100, "Middle name must be at most 100 characters")
        .regex(/^[a-zA-Z\s]*$/, "Middle name can only contain letters and spaces")
        .optional(),

    roleId: z.string()
        .uuid("Invalid role ID format")
        .optional(),
});

// Get User by ID Schema (for params)
export const getUserByIdParamsSchema = z.object({
    id: z.string()
        .uuid("Invalid user ID format")
        .min(1, "User ID is required")
});

// Toggle User Active Schema (PATCH /user/toggle-active/:id body)
export const toggleUserActiveSchema = z.object({
    active: z.boolean({
        required_error: "active is required",
        invalid_type_error: "active must be a boolean",
    })
});
