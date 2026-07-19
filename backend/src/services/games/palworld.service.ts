import { IGameService } from "../../interfaces/IGameService.js";
import { GameManifestS, GameManifestSchema, ServerSettingsS, PalworldSettingsS } from "@hightower/shared";

export const GameService: IGameService = {

    getGameManifest: async (settings: ServerSettingsS): Promise<GameManifestS> => {
        const gs = settings.game_settings as PalworldSettingsS;

        const rawManifest = {
            image: 'thijsvanloef/palworld-server-docker:latest',
            env: [
                `PUID=1000`,
                `PGID=1000`,
                `PORT=${settings.core_settings.host_port}`,
                `PLAYERS=${settings.core_settings.max_num_players}`,
                `SERVER_NAME=${settings.core_settings.name}`,
                `SERVER_PASSWORD=${gs.SERVER_PASSWORD}`,
                `ADMIN_PASSWORD=${gs.ADMIN_PASSWORD}`,
                `MULTITHREADING=true`,
                // Query-port server-browser listing and the REST admin API are both
                // skipped for now (see conversation) — direct-connect play doesn't
                // need either, and adding them requires a per-port protocol/fixed-vs-
                // relative port model this app doesn't have yet.
                `REST_API_ENABLED=false`,
                `COMMUNITY=false`,
                `TZ=UTC`,
            ],
            protocols: ['udp'],
            worldVolumes: [
                { path: '/palworld' },
            ],
            useHostPort: true,
        };

        return GameManifestSchema.parse(rawManifest);
    },

    getDefaultPort: (): string => '8211',

    getHostPort: (numberOfGameServers: number): number => {
        const port = 8211 + numberOfGameServers;
        if (port > 65535) {
            throw new Error("New host port exceeds the max port count");
        }
        return port;
    }
};
