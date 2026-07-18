import { GameManifestS, ServerSettingsS } from "@hightower/shared";

export interface IGameService{
    getGameManifest(gameSettings: ServerSettingsS): Promise<GameManifestS>;
    getDefaultPort() : string;
    getHostPort(numberOfGameServers: number): number;
}