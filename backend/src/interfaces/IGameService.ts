import { GameManifestS } from "../schemas/game.schema";
import { ServerSettingsS, ServerSettingsSchema } from "../schemas/server.schema"

export interface IGameService{
    getManifest(gameSettings: any): Promise<GameManifestS>;
    getDefaultPort() : string;
}