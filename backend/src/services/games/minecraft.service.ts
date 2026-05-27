import { IGameService } from "../../interfaces/IGameService";
import { GameManifestS, GameManifestSchema } from "@hightower/shared";
import { ServerSettingsS } from "@hightower/shared";

// ONLY THINGS THAT ARE UNIQUE TO MINECRAFT, This goes for all other files like this

// ALL the states and shit will be read from the database, so no class instantiations, this is why we export this like this

// we are exporting this as an object that respects the interface, by convention, the var should be called 
// the interface name without the I (just invented this shit)
export const GameService: IGameService = {
    getManifest: async (settings: ServerSettingsS): Promise<GameManifestS> => {
        const rawManifest = {
            image: 'itzg/minecraft-server:2024.1.0',
            env: [
                `EULA=${settings.game_settings.EULA}`,
                `TYPE=${settings.game_settings.TYPE}`,
                `VERSION=${settings.game_settings.VERSION}`,
                `MOTD=${settings.game_settings.MOTD}`,
                `MAX_PLAYERS=${settings.game_settings.MAX_PLAYERS}`,
                `VIEW_DISTANCE=${settings.game_settings.VIEW_DISTANCE}`
            ],
            protocols: [
                'tcp'
            ]
        };

        // Validate the output before returning it
        return GameManifestSchema.parse(rawManifest);
    },

    getDefaultPort: function (): string {
        return '25565';
    },

    getHostPort: function (numberOfGameServers: number): number {
        if( 25565 + numberOfGameServers > 65535){
            throw Error("New host port exceeds the max port count");
        }
        return (25565 + numberOfGameServers);
    }
};
