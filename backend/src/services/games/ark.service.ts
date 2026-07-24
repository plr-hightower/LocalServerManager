import { IGameService } from "../../interfaces/IGameService.js";
import { GameManifestS, GameManifestSchema, ServerSettingsS, ArkSettingsS } from "@hightower/shared";

export const GameService: IGameService = {

    getGameManifest: async (settings: ServerSettingsS): Promise<GameManifestS> => {
        const { game, SERVER_PASSWORD, ADMIN_PASSWORD, SERVER_MAP, ...gameplay } =
            settings.game_settings as ArkSettingsS;

        const env = [
            `am_ark_SessionName=${settings.core_settings.name}`,
            `am_serverMap=${SERVER_MAP}`,
            `am_ark_ServerAdminPassword=${ADMIN_PASSWORD}`,
            `am_ark_MaxPlayers=${settings.core_settings.max_num_players}`,
            ...(SERVER_PASSWORD ? [`am_ark_ServerPassword=${SERVER_PASSWORD}`] : []),
            ...Object.entries(gameplay)
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => `am_arkopt_${key}=${value}`),
        ];

        const rawManifest = {
            image: 'thmhoag/arkserver:latest',
            env,
            protocols: ['udp'],
            chownVolumesTo: '1000:1000',
            tty: true,
            networkMode: 'host',
            useHostPort: false,
            extraPorts: [1, 27015 - 7777],
            worldVolumes: [
                { path: '/ark' },
            ],
        };

        return GameManifestSchema.parse(rawManifest);
    },

    getDefaultPort: (): string => '7777',

    getHostPort: (numberOfGameServers: number): number => {
        const port = 7777 + (numberOfGameServers * 2);
        if (port > 65535) {
            throw new Error("New host port exceeds the max port count");
        }
        return port;
    }
};
