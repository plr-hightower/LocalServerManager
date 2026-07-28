import { IGameService } from "../../interfaces/IGameService.js";
import { GameManifestS, GameManifestSchema, ServerSettingsS, PalworldSettingsS } from "@hightower/shared";
import { firstFreePort } from "../serverHelper.service.js";

export const GameService: IGameService = {

    getGameManifest: async (settings: ServerSettingsS): Promise<GameManifestS> => {
        const { game, ...gameFields } = settings.game_settings as PalworldSettingsS;

        // Field names in PalworldSettingsSchema map 1:1 to their env var names,
        // so this is built programmatically instead of one line per setting.
        const env = [
            `PUID=1000`,
            `PGID=1000`,
            `PORT=${settings.core_settings.host_port}`,
            `PLAYERS=${settings.core_settings.max_num_players}`,
            `SERVER_NAME=${settings.core_settings.name}`,
            `MULTITHREADING=true`,
            `REST_API_ENABLED=false`,
            `COMMUNITY=false`,
            `TZ=UTC`,
            ...Object.entries(gameFields)
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => `${key}=${value}`),
        ];

        const rawManifest = {
            image: 'thijsvanloef/palworld-server-docker:latest',
            env,
            protocols: ['udp'],
            worldVolumes: [
                { path: '/palworld' },
            ],
            useHostPort: true,
        };

        return GameManifestSchema.parse(rawManifest);
    },

    getDefaultPort: (): string => '8211',

    getHostPort: (usedPorts: Set<number>): number => firstFreePort(8211, 1, usedPorts),
};
