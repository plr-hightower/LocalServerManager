import { IGameService } from "../../interfaces/IGameService.js";
import { GameManifestS, GameManifestSchema, ServerSettingsS, MinecraftSettingsS } from "@hightower/shared";
import { firstFreePort } from "../serverHelper.service.js";

const IMAGE_REPO = 'itzg/minecraft-server';
const IMAGE_TAG = '2026.7.0';
const DEFAULT_JAVA_VERSION = '21';

// the image defaults the heap to 1G regardless of the container limit, which OOMs modded
// servers , leave headroom under ram_alloc_mb for metaspace, GC and off-heap
const HEAP_FRACTION = 0.75;
const MIN_HEAP_MB = 512;

// per-loader env var the image uses to pin the loader build , VANILLA and PAPER have none
const LOADER_VERSION_ENV: Partial<Record<MinecraftSettingsS['TYPE'], string>> = {
    FORGE: 'FORGE_VERSION',
    NEOFORGE: 'NEOFORGE_VERSION',
    FABRIC: 'FABRIC_LOADER_VERSION',
    QUILT: 'QUILT_LOADER_VERSION',
};

// ONLY THINGS THAT ARE UNIQUE TO MINECRAFT, This goes for all other files like this
// ALL the states and shit will be read from the database, so no class instantiations, this is why we export this like this
// we are exporting this as an object that respects the interface, by convention, the var should be called 
// the interface name without the I (just invented this shit)
export const GameService: IGameService = {

    getGameManifest: async (settings: ServerSettingsS): Promise<GameManifestS> => {
        const gs = settings.game_settings as MinecraftSettingsS;

        // servers created before these fields existed have them undefined , stored settings are
        // never re-parsed through zod so the defaults can't backfill
        const javaVersion = gs.JAVA_VERSION ?? DEFAULT_JAVA_VERSION;
        const loaderVersionEnv = LOADER_VERSION_ENV[gs.TYPE];
        const loaderVersion = gs.LOADER_VERSION ?? 'LATEST';
        const heapMb = Math.max(
            MIN_HEAP_MB,
            Math.floor(settings.core_settings.ram_alloc_mb * HEAP_FRACTION),
        );

        const rawManifest = {
            image: `${IMAGE_REPO}:${IMAGE_TAG}-java${javaVersion}`,
            env: [
                `EULA=${gs.EULA}`,
                `TYPE=${gs.TYPE}`,
                `VERSION=${gs.VERSION}`,
                `MOTD=${gs.MOTD}`,
                `MAX_PLAYERS=${gs.MAX_PLAYERS}`,
                `VIEW_DISTANCE=${gs.VIEW_DISTANCE}`,
                `MEMORY=${heapMb}M`,
                // LATEST means "let the image decide", so send nothing
                ...(loaderVersionEnv && loaderVersion !== 'LATEST'
                    ? [`${loaderVersionEnv}=${loaderVersion}`]
                    : []),
            ],
            protocols: ['tcp'],
            worldVolumes: [
                { path: "/data" }
            ],
            useHostPort: false,
        };

        // Validate the output before returning it
        return GameManifestSchema.parse(rawManifest);
    },

    getDefaultPort: (): string => '25565',

    getHostPort: (usedPorts: Set<number>): number => firstFreePort(25565, 1, usedPorts),
};