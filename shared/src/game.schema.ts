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
    env: z.array(z.string().regex(/^[A-Za-z0-9_]+=.+$/)), // Validates "KEY=VALUE" format (keys may be mixed-case, e.g. arkmanager's am_* vars)
    protocols: z.array(z.enum(["tcp", "udp"])).default(["tcp"]),
    worldVolumes: z.array(VolumeMountSchema),
    // Mounted like worldVolumes, but NOT included in the world-download zip
    // (e.g. a steamcmd cache or backup folder that isn't the actual save data).
    supportVolumes: z.array(VolumeMountSchema).default([]),
    extraPorts: z.array(z.number().int()).default([]),
    // Steam hosted games need to have this true since steam gets the port in the container
    // hence we gotta map that shit to itself inside aswell
    useHostPort: z.boolean().default(false),
    // Container user (dockerode Config.User), e.g. "0" to run as root. Omit to
    // use the image's default user.
    user: z.string().optional(),
    // "uid:gid" to chown the mounted volumes to before the container starts.
    // Fresh Docker named volumes are root-owned; images that run as a non-root
    // user (e.g. arkmanager's steam uid) can't fix this themselves, so we
    // pre-chown as root using the image itself. Omit to skip.
    chownVolumesTo: z.string().regex(/^\d+:\d+$/).optional(),
    // Allocate a pseudo-TTY and keep stdin open (docker -t -i). Some images
    // (e.g. arkmanager) exit / restart-loop without it. Omit for false.
    tty: z.boolean().optional(),
    // Docker network mode (HostConfig.NetworkMode), e.g. "host". Host mode binds
    // the container's ports directly on the host with no NAT — required on Linux
    // for all-UDP games (ARK) whose Steam query/game traffic breaks under bridge
    // NAT. Ignored/unsupported by Docker Desktop on Windows/Mac. Omit for bridge.
    networkMode: z.string().optional(),
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