import { Request, Response } from 'express';
import { DbService } from '../repository/db.repository.js';
import { ZodError } from 'zod';
import { WorldRequestSchema } from '@hightower/shared';
import type { WorldRequestS } from '@hightower/shared';
import { streamWorldDownload} from '../services/world.service.js';


const db = new DbService();

/// <summary>
/// Downloads the world files for a server as a zip archive.
/// </summary>
const downloadWorld = async (req: Request, res: Response) => {
    try {
        const { name , created_by}: WorldRequestS = WorldRequestSchema.parse(req.body);

        console.log('[downloadWorld] looking up server:', JSON.stringify(name));
        const server = await db.getServerByName(name);
        console.log('[downloadWorld] found:', server?.core_settings.name ?? 'null');
        if (!server) {
            return res.status(404).json(({ error: "Server not found" }));
        }

        if (server.core_settings.status !== "stopped") {
            return res.status(400).json(({ error: "Stop the server before downloading" }));
        }

        await streamWorldDownload(server, res);

    } catch (err: unknown) {
        if (err instanceof ZodError) {
            return res.status(400).json(({ error: "Invalid request body", details: err.issues.toString() }));
        }
        if (err instanceof Error) {
            return res.status(500).json(({ error: "Failed to download world", details: err.message }));
        }
        res.status(500).json(({ error: "Unknown error" }));
    }
};

export const worldController = {
    downloadWorld
}