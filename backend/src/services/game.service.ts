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