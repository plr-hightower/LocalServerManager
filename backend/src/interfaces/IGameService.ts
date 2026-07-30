import { FileOwnerS, GameManifestS, GameSettingsS, ServerSettingsS } from "@hightower/shared";

export interface IGameService{
    getGameManifest(gameSettings: ServerSettingsS): Promise<GameManifestS>;
    getDefaultPort() : string;
    getHostPort(usedPorts: Set<number>): number;
    getMaxPlayers(gameSettings: GameSettingsS): number | null;
    getFileOwner(): FileOwnerS;
}