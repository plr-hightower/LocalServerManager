import { IGameService } from "../../interfaces/IGameService.js";
import { GameManifestS, GameManifestSchema, ServerSettingsS, ValheimSettingsS } from "@hightower/shared";

export const GameService: IGameService = {

    getGameManifest: async (settings: ServerSettingsS): Promise<GameManifestS> => {
        const gs = settings.game_settings as ValheimSettingsS;

        const rawManifest = {
            image: 'lloesche/valheim-server',
            env: [
                `SERVER_NAME=${settings.core_settings.name}`,
                `SERVER_PORT=${settings.core_settings.host_port}`,
                `WORLD_NAME=${settings.core_settings.name}`,
                `SERVER_PASS=${gs.SERVER_PASS}`,
                `SERVER_PUBLIC=true`,
                `MAX_PLAYERS=${settings.core_settings.max_num_players}`,
            ],
            protocols: ['udp'],
            worldVolumes: [
                { path: "/config" }
            ],
            extraPorts: [1],
            useHostPort: true,
        };

        return GameManifestSchema.parse(rawManifest);
    },

    getDefaultPort: (): string => '2456',

    getHostPort: (numberOfGameServers: number): number => {
        const port = 7000 + (numberOfGameServers * 2);
        if (port > 65535) {
            throw new Error("New host port exceeds the max port count");
        }
        return port;
    }
};