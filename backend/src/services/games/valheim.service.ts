import { IGameService } from "../../interfaces/IGameService.js";
import { GameManifestS, GameManifestSchema, ServerSettingsS, ValheimSettingsS } from "@hightower/shared";
import { firstFreePort } from "../serverHelper.service.js";

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

    // valheim binds host_port and host_port+1
    getHostPort: (usedPorts: Set<number>): number => firstFreePort(7000, 2, usedPorts, [0, 1]),
};