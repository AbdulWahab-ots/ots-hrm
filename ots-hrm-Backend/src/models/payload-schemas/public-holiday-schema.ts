import { z } from "zod";
import { HolidayType } from "../enums";

// Date validation helper
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const createPublicHolidaySchema = z.object({
  dates: z.array(dateStringSchema)
    .min(1, "At least one date is required")
    .max(30, "Maximum 30 dates allowed")
    .refine((dates) => {
      // Check for duplicate dates
      const uniqueDates = new Set(dates);
      return uniqueDates.size === dates.length;
    }, "Duplicate dates are not allowed"),

  isMultiple: z.boolean().default(false),

  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),

  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters")
    .optional(),

  whichCountryId: z.string()
    .uuid("Country ID must be a valid UUID")
    .optional(),

  departmentId: z.string()
    .uuid("Department ID must be a valid UUID"),

  type: z
    .string()
    .refine(
      (val) => Object.values(HolidayType).includes(val as HolidayType),
      {
        message: `Invalid type. Must be one of: ${Object.values(HolidayType).join(', ')}`,
      }
    ).optional(),
}).refine((data) => {
  // Validate isMultiple flag consistency
  if (data.dates.length > 1 && !data.isMultiple) {
    return false;
  }
  if (data.dates.length === 1 && data.isMultiple) {
    return false;
  }
  return true;
}, {
  message: "isMultiple flag must be consistent with the number of dates provided",
  path: ["isMultiple"]
}).refine((data) => {
  // Validate dates are in chronological order for multiple dates
  if (data.isMultiple && data.dates.length > 1) {
    const sortedDates = [...data.dates].sort();
    return JSON.stringify(sortedDates) === JSON.stringify(data.dates);
  }
  return true;
}, {
  message: "Multiple dates should be provided in chronological order",
  path: ["dates"]
});

export const updatePublicHolidaySchema = z.object({
  dates: z.array(dateStringSchema)
    .min(1, "At least one date is required")
    .max(30, "Maximum 30 dates allowed")
    .refine((dates) => {
      // Check for duplicate dates
      const uniqueDates = new Set(dates);
      return uniqueDates.size === dates.length;
    }, "Duplicate dates are not allowed"),

  isMultiple: z.boolean().default(false),

  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),

  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters")
    .optional(),

  whichCountryId: z.string()
    .uuid("Country ID must be a valid UUID")
    .optional(),

  departmentId: z.string()
    .uuid("Department ID must be a valid UUID"),

  type: z.
    string()
    .refine(
      (val) => Object.values(HolidayType).includes(val as HolidayType),
      {
        message: `Invalid type. Must be one of: ${Object.values(HolidayType).join(', ')}`,
      }
    ).optional(),
}).refine((data) => {
  // Validate isMultiple flag consistency
  if (data.dates.length > 1 && !data.isMultiple) {
    return false;
  }
  if (data.dates.length === 1 && data.isMultiple) {
    return false;
  }
  return true;
}, {
  message: "isMultiple flag must be consistent with the number of dates provided",
  path: ["isMultiple"]
}).refine((data) => {
  // Validate dates are in chronological order for multiple dates
  if (data.isMultiple && data.dates.length > 1) {
    const sortedDates = [...data.dates].sort();
    return JSON.stringify(sortedDates) === JSON.stringify(data.dates);
  }
  return true;
}, {
  message: "Multiple dates should be provided in chronological order",
  path: ["dates"]
});