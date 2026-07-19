import { GameManifestS, ServerSettingsS, toBind } from "@hightower/shared";
import Docker from 'dockerode';
import type { Response } from 'express';
import { getManifest } from "./game.service.js";
import { createRequire } from 'module'; // ESM import


const require = createRequire(import.meta.url); // create a require function
const archiver = require('archiver'); // use it like CommonJS


const docker = new Docker();


/// <summary>
/// Resolves the host filesystem paths for all world volumes of a server.
/// </summary>
/// <param name="server">The server whose world volumes to resolve.</param>
/// <returns>An array of host filesystem paths, one per world volume.</returns>
async function getWorldHostPaths(server: ServerSettingsS, manif?: GameManifestS): Promise<string[]> {
    const manifest: GameManifestS = manif ? manif : await getManifest(server);
    const paths: string[] = [];

    for (const volume of manifest.worldVolumes) {
        const volumeName = toBind(server.core_settings.name, volume).split(':')[0];
        const info = await docker.getVolume(volumeName).inspect();
        paths.push(info.Mountpoint);
    }

    return paths;
}

/// <summary>
/// Streams a zip archive of all world volumes directly to the HTTP response.
/// Each volume is placed in its own subfolder (vol0, vol1, ...) within the archive.
/// </summary>
/// <param name="server">The server whose world data to download.</param>
/// <param name="res">The Express response to stream the archive to.</param>
export async function streamWorldDownload(server: ServerSettingsS, res: Response): Promise<void> {
    const manifest: GameManifestS = await getManifest(server);
    const hostPaths = await getWorldHostPaths(server, manifest);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${server.core_settings.name}_world.zip"`);

    // Level 9 (max compression) is CPU-heavy enough to stall Node's single event
    // loop on large worlds, blocking every other in-flight request. Level 1 still
    // shrinks the archive meaningfully at a fraction of the CPU cost.
    const archive = archiver('zip', { zlib: { level: 1 } });

    archive.on('error', (err: Error) => {
        if (!res.headersSent) {
            res.status(500).contentType('application/json').json({ error: 'Failed to create archive', details: err.message });
        } else {
            res.destroy();
        }
    });

    archive.pipe(res);

    for (let i = 0; i < manifest.worldVolumes.length; i++) {
        archive.directory(hostPaths[i], `vol${i}`);
    }

    await archive.finalize();
}
