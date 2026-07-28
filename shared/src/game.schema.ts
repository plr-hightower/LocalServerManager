import * as z from "zod";
import { CoreServerSettingsSchema } from "./server.schema.js";

export const VolumeMountSchema = z.object({
    path: z.string().refine(
        p => p.startsWith('/') && !p.includes('..'),
        "Must be an absolute path and cannot contain '..'"
    ),
    // Distinguishes multiple volumes on the same server (toBind uses this to
    // avoid every volume collapsing onto the same server-named volume). Games
    // with a single volume (Minecraft, Valheim) can omit this.
    label: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

export const GameManifestSchema = z.object({
    image: z.string().min(1),
    env: z.array(z.string().regex(/^[A-Z0-9_]+=.+$/)), // Validates "KEY=VALUE" format
    protocols: z.array(z.enum(["tcp", "udp"])).default(["tcp"]),
    worldVolumes: z.array(VolumeMountSchema),
    // Mounted like worldVolumes, but NOT included in the world-download zip
    // (e.g. a steamcmd cache or backup folder that isn't the actual save data).
    supportVolumes: z.array(VolumeMountSchema).default([]),
    extraPorts: z.array(z.number().int()).default([]),
    // Steam hosted games need to have this true since steam gets the port in the container
    // hence we gotta map that shit to itself inside aswell
    useHostPort: z.boolean().default(false),
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

export const WorldRequestSchema = CoreServerSettingsSchema
    .pick({ name: true, created_by: true })
    .extend({ vol: z.coerce.number().int().min(0).optional() });


export type WorldRequestS = z.infer<typeof WorldRequestSchema>;
export type VolumeMountS = z.infer<typeof VolumeMountSchema>;
export type ContainerStatS = z.infer<typeof ContainerStatSchema>;
export type HealthCheckResponseS = z.infer<typeof HealthCheckResponseSchema>;
export type GameManifestS = z.infer<typeof GameManifestSchema>;

// you must have : separating the name and path, name -> volume, path -> the folder to redirect
export function toBind(serverName: string, mount: VolumeMountS): string {
    const volumeName = mount.label ? `${serverName}-${mount.label}` : serverName;
    return `${volumeName}:${mount.path}`;
}