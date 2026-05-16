import type { ServerInstance, ServerStatus } from "./t_server";

// API response format for server instance creation
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// Packet to send to create new server instance
export interface CreateServerRequest{
    gameId: string;
    name: string;
    settings: Record<string, any>
}

// Packet to send for power actions on server instance
export interface PowerActionRequest {
    actions: "start" | "stop" | "restart";
}

// API response format for server instance stats
export interface ServerStatsResponse {
    cpuUsage: number;    // in percentage
    memoryUsage: number; // in MB
    uptime: number;      // in seconds
}