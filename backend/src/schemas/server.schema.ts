import * as z from "zod";

export const GameEnum = z.enum(["minecraft","valheim"]);
export const RamAllocMbEnum = z.literal([ 1024, 2048, 4096, 8192]);
export const StatusEnum = z.enum(["started","starting","stopped","stopping","error"]);

export const CoreServerSettingsSchema = z.object({
    server_id: z.number().int(),
    name: z.string(),
    game_contrainer: GameEnum,
    container_id: z.string().length(64),
    ram_alloc_mb: RamAllocMbEnum,
    max_num_players : z.int().min(1).max(10).default(5),
    status: StatusEnum.default("starting"),
    //need to add some sort of default port mapping 
    host_port: z.number().int().min(6000).max(65535),
    default_host_port:z.string().optional(),
    created_by: z.string(),
    created_at: z.coerce.date()
});


// I probably should not nest it like this, instead it should be like a general dep in
export const MinecraftSettingsSchema = z.object({
    game: GameEnum,
    EULA: z.literal("TRUE").default("TRUE"),
    TYPE: z.enum(["VANILLA","PAPER","FABRIC"]).default("FABRIC"),
    VERSION: z.string().default("LATEST"),

    //Message of the day (whats below the server name)
    MOTD: z.string().max(59).default("A Minecraft Server"),

    // Resource Limits
    MAX_PLAYERS: CoreServerSettingsSchema.shape.max_num_players,
    VIEW_DISTANCE: z.number().int().min(3).max(32).default(10),

    //TODO: ADD RCON PASSWORD
});
// all possible settings depending on the game
export const GameSettingsSchema = z.discriminatedUnion("game",[
    MinecraftSettingsSchema
]);
// the settings that will be parsed
export const ServerSettingsSchema = z.object({
    core_settings: CoreServerSettingsSchema,
    game_settings: GameSettingsSchema
})
// IMPORTANT: do not name the type and value with the same name, compiler will be confused
export type GameE = z.infer<typeof GameEnum>;
export type RamAllocMbE = z.infer<typeof RamAllocMbEnum>;
export type StatusE = z.infer<typeof StatusEnum>;
export type CoreServerSettingsS = z.infer<typeof CoreServerSettingsSchema>;
export type ServerSettingsS = z.infer<typeof ServerSettingsSchema>;