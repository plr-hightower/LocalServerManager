import { ServerSettingsS, FileEntryS, FileOwnerS } from "@hightower/shared";
import fs from "fs/promises";
import path from "path";
import { getWorldHostPaths } from "./world.service.js";

async function resolvePath(server: ServerSettingsS, relPath: string): Promise<{ root: string; resolved: string }> {
    const hostPaths = await getWorldHostPaths(server);
    const segments = relPath.split(/[\\/]/).filter(Boolean);

    if (segments.length === 0) {
        throw new Error("No volume specified");
    }

    const match = /^vol(\d+)$/.exec(segments[0]);
    if (!match) {
        throw new Error("Unknown volume");
    }

    const volIndex = Number(match[1]);
    if (volIndex < 0 || volIndex >= hostPaths.length) {
        throw new Error("Volume index out of range");
    }

    const root = path.resolve(hostPaths[volIndex]);
    const resolved = path.resolve(root, segments.slice(1).join(path.sep));

    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
        throw new Error("Path escapes the volume");
    }

    return { root, resolved };
}

async function statEntry(dir: string, name: string): Promise<FileEntryS> {
    const stat = await fs.stat(path.join(dir, name));
    return {
        name,
        type: stat.isDirectory() ? "dir" : "file",
        size: stat.isDirectory() ? 0 : stat.size,
        mtimeMs: stat.mtimeMs,
    };
}

export async function listDirectory(server: ServerSettingsS, relPath: string): Promise<FileEntryS[]> {
    const segments = relPath.split(/[\\/]/).filter(Boolean);

    if (segments.length === 0) {
        const hostPaths = await getWorldHostPaths(server);
        return Promise.all(hostPaths.map(async (hostPath, i) => {
            const stat = await fs.stat(hostPath);
            return { name: `vol${i}`, type: "dir" as const, size: 0, mtimeMs: stat.mtimeMs };
        }));
    }

    const { resolved } = await resolvePath(server, relPath);
    const names = await fs.readdir(resolved);
    const entries = await Promise.all(names.map(name => statEntry(resolved, name)));

    return entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}

export async function deleteEntry(server: ServerSettingsS, relPath: string): Promise<void> {
    const { root, resolved } = await resolvePath(server, relPath);

    if (resolved === root) {
        throw new Error("Cannot delete a volume root");
    }

    await fs.rm(resolved, { recursive: true, force: false });
}

export async function resolveUploadDir(server: ServerSettingsS, relPath: string): Promise<string> {
    const { resolved } = await resolvePath(server, relPath);
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) {
        throw new Error("Upload target is not a directory");
    }
    return resolved;
}

// Uploaded folders arrive as files named by their relative path.
export async function prepareUploadTarget(dir: string, relName: string, owner?: FileOwnerS): Promise<string> {
    const segments = relName.split(/[\\/]/).filter(s => s && s !== "." && s !== "..");
    if (segments.length === 0) {
        throw new Error("Invalid upload file name");
    }

    const dest = path.join(dir, ...segments);
    const firstCreated = await fs.mkdir(path.dirname(dest), { recursive: true });
    if (owner && firstCreated) {
        await chownRecursive(firstCreated, owner);
    }
    return dest;
}

async function chownRecursive(target: string, owner: FileOwnerS): Promise<void> {
    await fs.chown(target, owner.uid, owner.gid);

    const entries = await fs.readdir(target, { withFileTypes: true });
    for (const entry of entries) {
        const child = path.join(target, entry.name);
        if (entry.isDirectory()) {
            await chownRecursive(child, owner);
        } else {
            await fs.chown(child, owner.uid, owner.gid);
        }
    }
}

export async function writeUploadedFile(
    dir: string,
    relName: string,
    tempPath: string,
    owner: FileOwnerS,
): Promise<void> {
    const dest = await prepareUploadTarget(dir, relName, owner);

    try {
        await fs.rename(tempPath, dest);
    } catch {
        await fs.copyFile(tempPath, dest);
        await fs.rm(tempPath, { force: true });
    }

    await fs.chown(dest, owner.uid, owner.gid);
}
