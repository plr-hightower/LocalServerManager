export enum ServerStatus {
    RUNNING = 'running',
    STOPPED = 'stopped',
    STARTING = 'starting',
    STOPPING = 'stopping',
    ERROR = 'error'
} 


export interface ServerInstance {
    id: string;
    gameId: string; // 'minecraft', 'valheim', etc.
    name: string;
    status: ServerStatus;
    port: number;
    settings: Record<string, any>; // Dynamic settings based on game
}