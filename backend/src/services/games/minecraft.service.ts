import { IGameService } from "../../interfaces/IGameService.js";
import { GameManifestS, GameManifestSchema, ServerSettingsS, MinecraftSettingsS } from "@hightower/shared";

// ONLY THINGS THAT ARE UNIQUE TO MINECRAFT, This goes for all other files like this
// ALL the states and shit will be read from the database, so no class instantiations, this is why we export this like this
// we are exporting this as an object that respects the interface, by convention, the var should be called 
// the interface name without the I (just invented this shit)
export const GameService: IGameService = {

    getGameManifest: async (settings: ServerSettingsS): Promise<GameManifestS> => {
        const gs = settings.game_settings as MinecraftSettingsS;

        const rawManifest = {
            image: 'itzg/minecraft-server:2024.1.0',
            env: [
                `EULA=${gs.EULA}`,
                `TYPE=${gs.TYPE}`,
                `VERSION=${gs.VERSION}`,
                `MOTD=${gs.MOTD}`,
                `MAX_PLAYERS=${gs.MAX_PLAYERS}`,
                `VIEW_DISTANCE=${gs.VIEW_DISTANCE}`
            ],
            protocols: ['tcp'],
            worldVolumes: [
                { path: "/data" }
            ],
        };

        // Validate the output before returning it
        return GameManifestSchema.parse(rawManifest);
    },

    getDefaultPort: (): string => '25565',

    getHostPort: (numberOfGameServers: number): number => {
        if (25565 + numberOfGameServers > 65535) {
            throw new Error("New host port exceeds the max port count");
        }
        return (25565 + numberOfGameServers);
    }
};