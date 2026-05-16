import { GameManifestS } from "@hightower/shared";

export interface IGameService{
    getManifest(gameSettings: any): Promise<GameManifestS>;
    getDefaultPort() : string;
}