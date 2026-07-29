import z from "zod";
import { nonEmptyTrimmedString } from "./general-schema";

export const createAnnouncementSchema = z.object({
    title: nonEmptyTrimmedString("Title"),
    description: nonEmptyTrimmedString("Description"),
});

export const updateAnnouncementSchema = z.object({
    title: nonEmptyTrimmedString("Title").optional(),
    description: nonEmptyTrimmedString("Description").optional(),
});
