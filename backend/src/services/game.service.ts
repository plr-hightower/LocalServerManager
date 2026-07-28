import type { GameManifestS, ServerSettingsS } from '@hightower/shared';
import type { IGameService } from '../interfaces/IGameService.js';

/// <summary>
/// Resolves the game service for the given server.
/// </summary>
/// <param name="server">The server whose game service to resolve.</param>
/// <returns>The game service for the server's game container.</returns>
export async function getGameService(server: ServerSettingsS): Promise<IGameService> {
    const module = await import(`./games/${server.core_settings.game_container}.service.js`);
    return module.GameService as IGameService;
}

/// <summary>
/// Resolves the game manifest for the given server.
/// </summary>
/// <param name="server">The server whose manifest to resolve.</param>
/// <returns>The game manifest for the server.</returns>
export async function getManifest(server: ServerSettingsS): Promise<GameManifestS> {
    const gameService = await getGameService(server);
    return gameService.getGameManifest(server);
}

// every host port already bound by existing servers, incl. extra ports
export async function getOccupiedPorts(servers: ServerSettingsS[]): Promise<Set<number>> {
    const occupied = new Set<number>();
    for (const server of servers) {
        const port = server.core_settings.host_port;
        if (port == null) continue;
        occupied.add(port);
        const manifest = await getManifest(server);
        for (const offset of manifest.extraPorts) occupied.add(port + offset);
    }
    return occupied;
}