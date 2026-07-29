import { z } from "zod";
import { nonEmptyTrimmedString } from "./general-schema";
import { CandidateStage, ProjectStatus } from "../enums";

// ─── Candidates ────────────────────────────────────────────────────────────

export const createCandidateSchema = z.object({
    name: nonEmptyTrimmedString("Name"),
    role: z.string().optional(),
    stage: z.nativeEnum(CandidateStage).optional(),
    owner: z.string().optional(),
    source: z.string().optional(),
    date: z.string().optional(),
    note: z.string().optional(),
    currentCompany: z.string().optional(),
    city: z.string().optional(),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    contact: z.string().optional(),
    currentSalary: z.string().optional(),
    expectedSalary: z.string().optional(),
    score: z.number().int().min(0).max(100).optional().nullable(),
    notice: z.string().optional(),
    active: z.boolean().optional(),
});

// POST accepts a single candidate or an array (bulk import).
export const createCandidateBulkSchema = z.union([
    createCandidateSchema,
    z.array(createCandidateSchema).min(1, "At least one candidate is required"),
]);

export const updateCandidateSchema = createCandidateSchema.partial();

// ─── Projects ────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
    name: nonEmptyTrimmedString("Name"),
    owner: z.string().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    // Any integer is accepted; the entity/service clamps it into 0..100 (spec 3.2),
    // so an out-of-range value is corrected rather than rejected.
    progress: z.number().int().optional(),
    due: z.string().optional(),
    note: z.string().optional(),
    active: z.boolean().optional(),
});

export const createProjectBulkSchema = z.union([
    createProjectSchema,
    z.array(createProjectSchema).min(1, "At least one project is required"),
]);

export const updateProjectSchema = createProjectSchema.partial();
