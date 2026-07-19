import { IGameService } from "../../interfaces/IGameService.js";
import { GameManifestS, GameManifestSchema, ServerSettingsS, AstroneerSettingsS } from "@hightower/shared";

export const GameService: IGameService = {

    getGameManifest: async (settings: ServerSettingsS): Promise<GameManifestS> => {
        const gs = settings.game_settings as AstroneerSettingsS;

        const env = [
            `ASTRO_SERVER_NAME=${settings.core_settings.name}`,
            `ASTRO_SERVER_OWNER_NAME=${gs.OWNER_NAME}`,
            `ASTRO_SERVER_PASSWORD=${gs.PASSWORD}`,
            `ASTRO_SERVER_PORT=${settings.core_settings.host_port}`,
            `ASTRO_SERVER_AUTO_SAVE_INTERVAL=${gs.AUTO_SAVE_INTERVAL}`,
            `ASTRO_SERVER_DISABLE_ENCRYPTION=${gs.DISABLE_ENCRYPTION}`,
        ];

        // Optional override for the image's own public-IP auto-detection.
        // A host-wide setting (same machine, same IP for every server), not
        // something a user picks per-server.
        if (process.env.PUBLIC_IP) {
            env.push(`ASTRO_SERVER_PUBLIC_IP=${process.env.PUBLIC_IP}`);
        }

        const rawManifest = {
            // Custom-built on top of barumel/docker-astroneer-server — see
            // docker/astroneer-server/ for the entrypoint.sh fix and why.
            image: 'hightower/astroneer-server:latest',
            env,
            protocols: ['tcp', 'udp'],
            worldVolumes: [
                { path: '/astroneer', label: 'astroneer' },
            ],
            supportVolumes: [
                { path: '/steamcmd', label: 'steamcmd' },
                { path: '/backup', label: 'backup' },
            ],
            useHostPort: true,
        };

        return GameManifestSchema.parse(rawManifest);
    },

    getDefaultPort: (): string => '8777',

    getHostPort: (numberOfGameServers: number): number => {
        const port = 8777 + numberOfGameServers;
        if (port > 65535) {
            throw new Error("New host port exceeds the max port count");
        }
        return port;
    }
};
