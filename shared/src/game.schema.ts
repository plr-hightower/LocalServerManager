import * as z from "zod";

export const GameManifestSchema = z.object({
    image: z.string().min(1),
    env: z.array(z.string().regex(/^[A-Z0-9_]+=.+$/)), // Validates "KEY=VALUE" format
    protocols: z.array(z.enum(["tcp", "udp"])).default(["tcp"])
});

export type GameManifestS = z.infer<typeof GameManifestSchema>;