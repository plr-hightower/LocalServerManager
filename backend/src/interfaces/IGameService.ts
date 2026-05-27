import { GameManifestS, ServerSettingsS } from "@hightower/shared";

export interface IGameService{
    getManifest(gameSettings: ServerSettingsS): Promise<GameManifestS>;
    getDefaultPort() : string;
    getHostPort(numberOfGameServers: number): number;
}