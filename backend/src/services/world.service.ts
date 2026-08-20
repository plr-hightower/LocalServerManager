import { GameManifestS, ServerSettingsS, toBind } from "@hightower/shared";
import Docker from 'dockerode';
import type { Response } from 'express';
import { getManifest } from "./game.service.js";
import { createRequire } from 'module'; // ESM import


const require = createRequire(import.meta.url); // create a require function
const archiver = require('archiver'); // use it like CommonJS


const docker = new Docker();

export type ZipDirS = { src: string; name: string };


/// <summary>
/// Resolves the host filesystem paths for all world volumes of a server.
/// </summary>
/// <param name="server">The server whose world volumes to resolve.</param>
/// <returns>An array of host filesystem paths, one per world volume.</returns>
export async function getWorldHostPaths(server: ServerSettingsS, manif?: GameManifestS): Promise<string[]> {
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
/// Streams a zip archive of the given host directories to the HTTP response.
/// Each entry is placed in its own subfolder, named by its 'name'.
/// </summary>
/// <param name="res">The Express response to stream the archive to.</param>
/// <param name="filename">The file name offered to the browser.</param>
/// <param name="dirs">The host directories to archive.</param>
export async function streamZip(res: Response, filename: string, dirs: ZipDirS[]): Promise<void> {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // store: game saves are already compressed
    const archive = archiver('zip', { store: true });

    archive.on('error', (err: Error) => {
        if (!res.headersSent) {
            res.status(500).contentType('application/json').json({ error: 'Failed to create archive', details: err.message });
        } else {
            res.destroy();
        }
    });

    archive.pipe(res);

    for (const dir of dirs) {
        archive.directory(dir.src, dir.name);
    }

    await archive.finalize();
}

/// <summary>
/// Streams a zip archive of all world volumes directly to the HTTP response.
/// Each volume is placed in its own subfolder (vol0, vol1, ...) within the archive.
/// </summary>
/// <param name="server">The server whose world data to download.</param>
/// <param name="res">The Express response to stream the archive to.</param>
export async function streamWorldDownload(server: ServerSettingsS, res: Response, vol?: number): Promise<void> {
    const manifest: GameManifestS = await getManifest(server);
    const hostPaths = await getWorldHostPaths(server, manifest);

    if (vol !== undefined && (vol < 0 || vol >= hostPaths.length)) {
        throw new Error(`Volume index ${vol} out of range`);
    }

    const indices = vol !== undefined ? [vol] : hostPaths.map((_, i) => i);
    const fileSuffix = vol !== undefined ? `vol${vol}` : 'world';
    const dirs = indices.map(i => ({ src: hostPaths[i], name: `vol${i}` }));

    await streamZip(res, `${server.core_settings.name}_${fileSuffix}.zip`, dirs);
}
