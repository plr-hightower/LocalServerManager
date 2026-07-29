import * as z from "zod";

export const GameEnum = z.enum(["minecraft","valheim","palworld"]);
export const RamAllocMbEnum = z.literal([ 1024, 2048, 4096, 8192]);
export const StatusEnum = z.enum(["started","starting","stopped","stopping","error"]);

export const CoreServerSettingsSchema = z.object({
    server_id: z.number().int().optional(),
    name: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Name can only contain letters, numbers, underscores and dashes"),
    game_container: GameEnum,
    container_id: z.string().max(64),
    ram_alloc_mb: RamAllocMbEnum,
    max_num_players : z.int().min(1).max(10).default(5),
    status: StatusEnum.default("starting"),
    //need to add some sort of default port mapping 
    host_port: z.number().int().min(6000).max(65535).nullable(),
    default_host_port:z.string().nullable(),
    created_by: z.string(),
    created_at: z.coerce.date(),
    manager_password: z.string().min(4).nullable().optional(),
    // env-key -> visible; controls whether a setting shows on the detail page
    env_visibility: z.record(z.string(), z.boolean()).optional(),
});

// I probably should not nest it like this, instead it should be like a general dep in
export const MinecraftSettingsSchema = z.object({
    game: z.literal("minecraft"),
    EULA: z.literal("TRUE").default("TRUE"),
    TYPE: z.enum(["VANILLA","PAPER","FABRIC","FORGE","NEOFORGE","QUILT"]).default("FABRIC"),
    VERSION: z.string().default("LATEST"),
    // Forge 1.19.2 needs 17, Fabric on 1.20.5+ needs 21
    JAVA_VERSION: z.enum(["8","11","16","17","21","25"]).default("21"),
    // loader/installer build, LATEST lets the image pick , ignored by VANILLA and PAPER
    LOADER_VERSION: z.string().default("LATEST"),

    //Message of the day (whats below the server name)
    MOTD: z.string().max(59).default("A Minecraft Server"),

    // Resource Limits
    MAX_PLAYERS: CoreServerSettingsSchema.shape.max_num_players,
    VIEW_DISTANCE: z.number().int().min(3).max(32).default(10),

    //TODO: ADD RCON PASSWORD
});

export const ValheimSettingsSchema = z.object({
    game: z.literal("valheim"),
    SERVER_PASS: z.string().min(5, "Password must be at least 5 characters.").meta({ secret: true }),
});

// Game/world settings (PalWorldSettings.ini, via thijsvanloef/palworld-server-docker).
// SERVER_NAME, PORT, and PLAYERS come from core_settings instead , see palworld.service.ts.
export const PalworldSettingsSchema = z.object({
    game: z.literal("palworld"),

    SERVER_PASSWORD: z.string().min(1, "Server password is required.").meta({ secret: true }),
    ADMIN_PASSWORD: z.string().min(1, "Admin password is required.").meta({ secret: true }),

    DIFFICULTY: z.enum(["None", "Normal", "Difficult"]).default("None"),
    RANDOMIZER_TYPE: z.string().default("None"),
    RANDOMIZER_SEED: z.string().optional(),
    DAYTIME_SPEEDRATE: z.number().default(1.0),
    NIGHTTIME_SPEEDRATE: z.number().default(1.0),
    EXP_RATE: z.number().default(1.0),
    PAL_CAPTURE_RATE: z.number().default(1.0),
    PAL_SPAWN_NUM_RATE: z.number().default(1.0),
    PAL_DAMAGE_RATE_ATTACK: z.number().default(1.0),
    PAL_DAMAGE_RATE_DEFENSE: z.number().default(1.0),
    PLAYER_DAMAGE_RATE_ATTACK: z.number().default(1.0),
    PLAYER_DAMAGE_RATE_DEFENSE: z.number().default(1.0),
    PLAYER_STOMACH_DECREASE_RATE: z.number().default(1.0),
    PLAYER_STAMINA_DECREASE_RATE: z.number().default(1.0),
    PLAYER_AUTO_HP_REGEN_RATE: z.number().default(1.0),
    PLAYER_AUTO_HP_REGEN_RATE_IN_SLEEP: z.number().default(1.0),
    PAL_STOMACH_DECREASE_RATE: z.number().default(1.0),
    PAL_STAMINA_DECREASE_RATE: z.number().default(1.0),
    PAL_AUTO_HP_REGEN_RATE: z.number().default(1.0),
    PAL_AUTO_HP_REGEN_RATE_IN_SLEEP: z.number().default(1.0),
    BUILD_OBJECT_HP_RATE: z.number().default(1.0),
    BUILD_OBJECT_DAMAGE_RATE: z.number().default(1.0),
    BUILD_OBJECT_DETERIORATION_DAMAGE_RATE: z.number().default(1.0),
    COLLECTION_DROP_RATE: z.number().default(1.0),
    COLLECTION_OBJECT_HP_RATE: z.number().default(1.0),
    COLLECTION_OBJECT_RESPAWN_SPEED_RATE: z.number().default(1.0),
    ENEMY_DROP_ITEM_RATE: z.number().default(1.0),
    DEATH_PENALTY: z.enum(["None", "Item", "ItemAndEquipment", "All"]).default("Item"),
    ENABLE_PLAYER_TO_PLAYER_DAMAGE: z.boolean().default(false),
    ENABLE_FRIENDLY_FIRE: z.boolean().default(false),
    ENABLE_INVADER_ENEMY: z.boolean().default(true),
    ACTIVE_UNKO: z.boolean().default(false),
    ENABLE_AIM_ASSIST_PAD: z.boolean().default(true),
    ENABLE_AIM_ASSIST_KEYBOARD: z.boolean().default(false),
    DROP_ITEM_MAX_NUM: z.number().int().default(3000),
    DROP_ITEM_MAX_NUM_UNKO: z.number().int().default(100),
    BASE_CAMP_MAX_NUM: z.number().int().default(128),
    BASE_CAMP_WORKER_MAX_NUM: z.number().int().default(15),
    DROP_ITEM_ALIVE_MAX_HOURS: z.number().default(1.0),
    AUTO_RESET_GUILD_NO_ONLINE_PLAYERS: z.boolean().default(false),
    AUTO_RESET_GUILD_TIME_NO_ONLINE_PLAYERS: z.number().default(72.0),
    GUILD_PLAYER_MAX_NUM: z.number().int().default(20),
    BASE_CAMP_MAX_NUM_IN_GUILD: z.number().int().default(4),
    PAL_EGG_DEFAULT_HATCHING_TIME: z.number().default(1.0),
    WORK_SPEED_RATE: z.number().default(1.0),
    AUTO_SAVE_SPAN: z.number().default(30.0),
    IS_MULTIPLAY: z.boolean().default(false),
    IS_PVP: z.boolean().default(false),
    HARDCORE: z.boolean().default(false),
    CHARACTER_RECREATE_IN_HARDCORE: z.boolean().default(false),
    PAL_LOST: z.boolean().default(false),
    CAN_PICKUP_OTHER_GUILD_DEATH_PENALTY_DROP: z.boolean().default(false),
    ENABLE_NON_LOGIN_PENALTY: z.boolean().default(true),
    ENABLE_FAST_TRAVEL: z.boolean().default(true),
    IS_START_LOCATION_SELECT_BY_MAP: z.boolean().default(false),
    EXIST_PLAYER_AFTER_LOGOUT: z.boolean().default(false),
    ENABLE_DEFENSE_OTHER_GUILD_PLAYER: z.boolean().default(false),
    INVISIBLE_OTHER_GUILD_BASE_CAMP_AREA_FX: z.boolean().default(false),
    BUILD_AREA_LIMIT: z.boolean().default(false),
    ITEM_WEIGHT_RATE: z.number().default(1.0),
    COOP_PLAYER_MAX_NUM: z.number().int().default(4),
    USEAUTH: z.boolean().default(true),
    ENABLE_GAMEDATA_API: z.boolean().default(false),
    SHOW_PLAYER_LIST: z.boolean().default(false),
    CHAT_POST_LIMIT_PER_MINUTE: z.number().int().default(30),
    ENABLE_PREDATOR_BOSS_PAL: z.boolean().default(true),
    MAX_BUILDING_LIMIT_NUM: z.number().int().default(0),
    SERVER_REPLICATE_PAWN_CULL_DISTANCE: z.number().default(15000.0),
    SERVER_REPLICATE_PAWN_CULL_DISTANCE_IN_BASE_CAMP: z.number().default(5000.0),
    USE_BACKUP_SAVE_DATA: z.boolean().default(true),
    ALLOW_GLOBAL_PALBOX_EXPORT: z.boolean().default(true),
    ALLOW_GLOBAL_PALBOX_IMPORT: z.boolean().default(false),
    EQUIPMENT_DURABILITY_DAMAGE_RATE: z.number().default(1.0),
    ITEM_CONTAINER_FORCE_MARK_DIRTY_INTERVAL: z.number().default(1.0),
    ITEM_CORRUPTION_MULTIPLIER: z.number().default(1.0),
    PHYSICS_ACTIVE_DROP_ITEM_MAX_NUM: z.number().int().default(-1),
    ALLOW_CLIENT_MOD: z.boolean().default(true),
    PLAYER_DATA_PAL_STORAGE_UPDATE_CHECK_TICK_INTERVAL: z.number().default(1.0),
    IS_SHOW_JOIN_LEFT_MESSAGE: z.boolean().default(true),
    MONSTER_FARM_ACTION_SPEED_RATE: z.number().default(1.0),
    DENY_TECHNOLOGY_LIST: z.string().optional(),
    GUILD_REJOIN_COOLDOWN_MINUTES: z.number().int().default(0),
    AUTO_TRANSFER_MASTER_CHECK_INTERVAL_SECONDS: z.number().default(3600.0),
    AUTO_TRANSFER_MASTER_THRESHOLD_DAYS: z.number().int().default(14),
    MAX_GUILDS_PER_FRAME: z.number().int().default(10),
    BLOCK_RESPAWN_TIME: z.number().default(5.0),
    RESPAWN_PENALTY_DURATION_THRESHOLD: z.number().default(0.0),
    RESPAWN_PENALTY_TIME_SCALE: z.number().default(2.0),
    DISPLAY_PVP_ITEM_NUM_ON_WORLD_MAP_BASE_CAMP: z.boolean().default(false),
    DISPLAY_PVP_ITEM_NUM_ON_WORLD_MAP_PLAYER: z.boolean().default(false),
    ADDITIONAL_DROP_ITEM_WHEN_PLAYER_KILLING_IN_PVP_MODE: z.string().default("PlayerDropItem"),
    ADDITIONAL_DROP_ITEM_NUM_WHEN_PLAYER_KILLING_IN_PVP_MODE: z.number().int().default(1),
    ADDITIONAL_DROP_ITEM_WHEN_PLAYER_KILLING_IN_PVP_MODE_ENABLED: z.boolean().default(false),
    ENABLE_VOICE_CHAT: z.boolean().default(false),
    VOICE_CHAT_MAX_VOLUME_DISTANCE: z.number().default(3000.0),
    VOICE_CHAT_ZERO_VOLUME_DISTANCE: z.number().default(15000.0),
    ALLOW_ENHANCE_STAT_HEALTH: z.boolean().default(true),
    ALLOW_ENHANCE_STAT_ATTACK: z.boolean().default(true),
    ALLOW_ENHANCE_STAT_STAMINA: z.boolean().default(true),
    ALLOW_ENHANCE_STAT_WEIGHT: z.boolean().default(true),
    ALLOW_ENHANCE_STAT_WORK_SPEED: z.boolean().default(true),
    ENABLE_BUILDING_PLAYER_UID_DISPLAY: z.boolean().default(false),
    BUILDING_NAME_DISPLAY_CACHE_TTL_SECONDS: z.number().default(60),
});

// all possible settings depending on the game
export const GameSettingsSchema = z.discriminatedUnion("game",[
    MinecraftSettingsSchema,
    ValheimSettingsSchema,
    PalworldSettingsSchema,
]);

// Since we don't want the user to play with certain values, we ommit them
export const CreateServerRequestSchema = z.object({
  core_settings: CoreServerSettingsSchema.omit({
    server_id: true,
    container_id: true,
    status: true,
    host_port: true,
    default_host_port: true,
    created_at: true,
  }),
  game_settings: GameSettingsSchema,
  admin_password: z.string().optional(),
});

export const DeleteServerRequestSchema = CoreServerSettingsSchema
    .pick({ name: true, created_by: true })
    .extend({ password: z.string().min(1, "Password is required") });


export const ServerActionSchema = z.object({
    name: z.string(),
    action: StatusEnum,
});

// the settings that will be parsed
export const ServerSettingsSchema = z.object({
    core_settings: CoreServerSettingsSchema,
    game_settings: GameSettingsSchema
});
// IMPORTANT: do not name the type and value with the same name, compiler will be confused
export type GameE = z.infer<typeof GameEnum>;
export type RamAllocMbE = z.infer<typeof RamAllocMbEnum>;
export type StatusE = z.infer<typeof StatusEnum>;
export type CoreServerSettingsS = z.infer<typeof CoreServerSettingsSchema>;
export type CreateServerRequestS = z.infer<typeof CreateServerRequestSchema>;
export type DeleteServerRequestS = z.infer<typeof DeleteServerRequestSchema>;
export type ServerSettingsS = z.infer<typeof ServerSettingsSchema>;
export type ServerActionS = z.infer<typeof ServerActionSchema>;
export type ValheimSettingsS = z.infer<typeof ValheimSettingsSchema>;
export type MinecraftSettingsS = z.infer<typeof MinecraftSettingsSchema>;
export type PalworldSettingsS = z.infer<typeof PalworldSettingsSchema>;