import z from "zod";
import { EmployeeStatus } from "../enums";
import { multipleEmployeeBenefitsSchema } from "./employee-benefit-schema";

export const createEmployeeSchema = z.object(
    {
        user: z.object({
            userName: z.string(),
            password: z.string(),
            email: z.string().email(),
            firstName: z.string(),
            lastName: z.string(),
            middleName: z.string().optional(),
        }),
        employeeCode: z.string().optional(),
        departmentId: z.string()
            .uuid("Invalid departmentId: must be a valid UUID"),
        designationId: z.string()
            .uuid("Invalid designationId: must be a valid UUID"),
        joiningDate: z.string(),
        salary: z.number().optional(),
        status: z
            .string()
            .refine(
              (val) => Object.values(EmployeeStatus).includes(val as EmployeeStatus),
              {
                message: `Invalid status. Must be one of: ${Object.values(EmployeeStatus).join(', ')}`,
              }
            ).optional(),
        probationEndDate: z.string().optional(),
        departureDate: z.string().optional(),
        dateOfBirth: z.string().optional(),
        phoneNumber: z.string().optional(),
        emergencyContact: z.string().optional(),
        shiftId: z.string().uuid().optional(),
        benefits: multipleEmployeeBenefitsSchema,
        // Bank Details
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        ibanNumber: z.string().optional(),
        zkDeviceUserId: z.string().optional(),
    }
);

export const updateEmployeeSchema = z.object(
    {
        user: z.object({
            userName: z.string(),
            password: z.string().optional(),
            email: z.string().email().optional(),
            firstName: z.string(),
            lastName: z.string(),
            middleName: z.string().optional(),
        }).optional(),
        employeeCode: z.string(),
        departmentId: z.string()
            .uuid("Invalid departmentId: must be a valid UUID"),
        designationId: z.string()
            .uuid("Invalid designationId: must be a valid UUID"),
        joiningDate: z.string(),
        salary: z.number().optional(),
        status: z
        .string()
            .refine(
              (val) => Object.values(EmployeeStatus).includes(val as EmployeeStatus),
              {
                message: `Invalid status. Must be one of: ${Object.values(EmployeeStatus).join(', ')}`,
              }
        ).optional(),
        probationEndDate: z.string().optional(),
        departureDate: z.string().optional(),
        dateOfBirth: z.string().optional(),
        phoneNumber: z.string().optional(),
        emergencyContact: z.string().optional(),
        shiftId: z.string().uuid().optional(),
        benefits: multipleEmployeeBenefitsSchema,
        // Bank Details
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        ibanNumber: z.string().optional(),
        zkDeviceUserId: z.string().optional(),
    }
);

const RESIGNATION_STATUSES = [EmployeeStatus.RESIGNED, EmployeeStatus.TERMINATED, EmployeeStatus.RETIRED];

export const resignEmployeeSchema = z.object(
    {
        status: z
            .string()
            .refine(
                (val) => RESIGNATION_STATUSES.includes(val as EmployeeStatus),
                {
                    message: `Invalid status. Must be one of: ${RESIGNATION_STATUSES.join(', ')}`,
                }
            ),
        effectiveDate: z.string(),
    }
);
