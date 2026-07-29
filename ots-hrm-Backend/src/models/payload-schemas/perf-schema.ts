import { z } from "zod";
import { nonEmptyTrimmedString } from "./general-schema";

// ─── Skills ──────────────────────────────────────────────────────────────────

export const createSkillSchema = z.object({
    name: nonEmptyTrimmedString("Name"),
    key: z.string().trim().optional(),
    description: z.string().optional(),
    scaleMin: z.number().int().optional(),
    scaleMax: z.number().int().positive().optional(),
    weight: z.number().positive().optional(),
    sortOrder: z.number().int().optional(),
    active: z.boolean().optional(),
});

export const updateSkillSchema = createSkillSchema.partial();

// ─── Assessments ───────────────────────────────────────────────────────────

const scoreSchema = z.object({
    skillId: z.string().uuid("Invalid skillId"),
    score: z.number(),
});

export const createAssessmentSchema = z.object({
    employeeId: z.string().uuid("Invalid employeeId"),
    assessedOn: z.string().min(1, "assessedOn is required"),
    assessor: z.string().optional(),
    note: z.string().optional(),
    scores: z.array(scoreSchema).min(1, "At least one score is required"),
});

export const updateAssessmentSchema = z.object({
    assessedOn: z.string().min(1).optional(),
    assessor: z.string().optional(),
    note: z.string().optional(),
    scores: z.array(scoreSchema).optional(),
});
