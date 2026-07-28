import * as z from "zod";
import { CoreServerSettingsSchema } from "./server.schema.js";

export const FilePathSchema = z.string()
    .refine(p => !p.startsWith('/'), "Path must be relative")
    .refine(p => !p.split(/[\\/]/).includes('..'), "Path cannot contain '..'");

const FileRequestBaseSchema = CoreServerSettingsSchema
    .pick({ name: true, created_by: true })
    .extend({
        path: FilePathSchema.default(""),
        password: z.string().min(1, "Password is required"),
    });

export const FileListRequestSchema = FileRequestBaseSchema;
export const FileDeleteRequestSchema = FileRequestBaseSchema;
export const FileUploadFieldsSchema = FileRequestBaseSchema;

export const FileEntrySchema = z.object({
    name: z.string(),
    type: z.enum(["file", "dir"]),
    size: z.number().int(),
    mtimeMs: z.number(),
});

export const FileListResponseSchema = z.object({
    path: z.string(),
    entries: z.array(FileEntrySchema),
});

export type FilePathS = z.infer<typeof FilePathSchema>;
export type FileListRequestS = z.infer<typeof FileListRequestSchema>;
export type FileDeleteRequestS = z.infer<typeof FileDeleteRequestSchema>;
export type FileUploadFieldsS = z.infer<typeof FileUploadFieldsSchema>;
export type FileEntryS = z.infer<typeof FileEntrySchema>;
export type FileListResponseS = z.infer<typeof FileListResponseSchema>;
