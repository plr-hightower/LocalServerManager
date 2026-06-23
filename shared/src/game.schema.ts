import * as z from "zod";
import { CoreServerSettingsSchema } from "./server.schema.js";

export const VolumeMountSchema = z.object({
    path: z.string().refine(
        p => p.startsWith('/') && !p.includes('..'),
        "Must be an absolute path and cannot contain '..'"
    ),
});

export const GameManifestSchema = z.object({
    image: z.string().min(1),
    env: z.array(z.string().regex(/^[A-Z0-9_]+=.+$/)), // Validates "KEY=VALUE" format
    protocols: z.array(z.enum(["tcp", "udp"])).default(["tcp"]),
    worldVolumes: z.array(VolumeMountSchema),
    extraPorts: z.array(z.number().int()).default([]),
});

export const ContainerStatSchema = z.object({
    containerId: z.string(),
    name: z.string(),
    cpuUsagePercent: z.number(),
    memoryUsageMb: z.number(),
    memoryLimitMb: z.number(),
    memoryUsagePercent: z.number(),
});

export const HealthCheckResponseSchema = z.object({
    servers: z.object({
        total: z.number().int(),
        running: z.number().int(),
        available: z.number().int(),
    }),
    containers: z.array(ContainerStatSchema),
});

export const WorldRequestSchema = CoreServerSettingsSchema.pick({name: true, created_by: true});


export type WorldRequestS = z.infer<typeof WorldRequestSchema>;
export type VolumeMountS = z.infer<typeof VolumeMountSchema>;
export type ContainerStatS = z.infer<typeof ContainerStatSchema>;
export type HealthCheckResponseS = z.infer<typeof HealthCheckResponseSchema>;
export type GameManifestS = z.infer<typeof GameManifestSchema>;

// you must have : separating the name and path, name -> volume, path -> the folder to redirect 
export function toBind(serverName: string, mount: VolumeMountS): string {
    return `${serverName}:${mount.path}`;
}