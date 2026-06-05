import * as z from "zod";

export const GameManifestSchema = z.object({
    image: z.string().min(1),
    env: z.array(z.string().regex(/^[A-Z0-9_]+=.+$/)), // Validates "KEY=VALUE" format
    protocols: z.array(z.enum(["tcp", "udp"])).default(["tcp"])
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

export type ContainerStatS = z.infer<typeof ContainerStatSchema>;
export type HealthCheckResponseS = z.infer<typeof HealthCheckResponseSchema>;
export type GameManifestS = z.infer<typeof GameManifestSchema>;