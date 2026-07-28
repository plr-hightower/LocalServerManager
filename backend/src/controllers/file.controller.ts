import { Request, Response } from 'express';
import { ZodError } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { DbService } from '../repository/db.repository.js';
import {
    FileListRequestSchema,
    FileDeleteRequestSchema,
    FileUploadFieldsSchema,
    FileListResponseSchema,
} from '@hightower/shared';
import { listDirectory, deleteEntry, resolveUploadDir } from '../services/file.service.js';
import { verifyManagerPassword } from '../services/password.service.js';

const db = new DbService();

const listFiles = async (req: Request, res: Response) => {
    try {
        const { name, path: relPath, password } = FileListRequestSchema.parse(req.body);

        const server = await db.getServerByName(name);
        if (!server) {
            return res.status(404).json({ error: "Server not found" });
        }
        if (!await verifyManagerPassword(server, password)) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const entries = await listDirectory(server, relPath);
        return res.status(200).json(FileListResponseSchema.parse({ path: relPath, entries }));

    } catch (err: unknown) {
        if (err instanceof ZodError) {
            return res.status(400).json({ error: "Invalid request", details: err.issues });
        }
        if (err instanceof Error) {
            return res.status(400).json({ error: "Failed to list files", details: err.message });
        }
        res.status(500).json({ error: "Unknown error" });
    }
};

const deleteFiles = async (req: Request, res: Response) => {
    try {
        const { name, path: relPath, password } = FileDeleteRequestSchema.parse(req.body);

        const server = await db.getServerByName(name);
        if (!server) {
            return res.status(404).json({ error: "Server not found" });
        }
        if (!await verifyManagerPassword(server, password)) {
            return res.status(401).json({ error: "Invalid password" });
        }
        if (server.core_settings.status !== "stopped") {
            return res.status(400).json({ error: "Stop the server before modifying files" });
        }

        await deleteEntry(server, relPath);
        return res.status(200).json({ success: true });

    } catch (err: unknown) {
        if (err instanceof ZodError) {
            return res.status(400).json({ error: "Invalid request", details: err.issues });
        }
        if (err instanceof Error) {
            return res.status(400).json({ error: "Failed to delete", details: err.message });
        }
        res.status(500).json({ error: "Unknown error" });
    }
};

const uploadFiles = async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const cleanup = () => Promise.all(files.map(f => fs.rm(f.path, { force: true }).catch(() => {})));

    try {
        const { name, path: relPath, password } = FileUploadFieldsSchema.parse(req.body);

        const server = await db.getServerByName(name);
        if (!server) {
            await cleanup();
            return res.status(404).json({ error: "Server not found" });
        }
        if (!await verifyManagerPassword(server, password)) {
            await cleanup();
            return res.status(401).json({ error: "Invalid password" });
        }
        if (server.core_settings.status !== "stopped") {
            await cleanup();
            return res.status(400).json({ error: "Stop the server before modifying files" });
        }
        if (files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const dir = await resolveUploadDir(server, relPath);

        for (const file of files) {
            const dest = path.join(dir, path.basename(file.originalname));
            try {
                await fs.rename(file.path, dest);
            } catch {
                await fs.copyFile(file.path, dest);
                await fs.rm(file.path, { force: true });
            }
        }

        return res.status(200).json({ success: true, count: files.length });

    } catch (err: unknown) {
        await cleanup();
        if (err instanceof ZodError) {
            return res.status(400).json({ error: "Invalid request", details: err.issues });
        }
        if (err instanceof Error) {
            return res.status(400).json({ error: "Failed to upload files", details: err.message });
        }
        res.status(500).json({ error: "Unknown error" });
    }
};

export const fileController = {
    listFiles,
    deleteFiles,
    uploadFiles,
};
