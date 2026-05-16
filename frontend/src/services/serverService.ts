import type { ApiResponse, CreateServerRequest } from "@rig/shared";
import type { ServerInstance } from "@rig/shared";

// Service to handle server-related API calls
export const serverService = {
    // return type is what the API is expected to return, in this case a ServerInstance wrapped in an ApiResponse
    async createServer(payload: CreateServerRequest): Promise<ApiResponse<ServerInstance>> {
        console.log ("Sending Payload to API:", payload);

        // faking delay 
        await new Promise(resolve => setTimeout(resolve, 700));

        // fake successful response
        return { 
            success: true,
            data : {
                id: 'real-id-from-api',
                status: 'stopped',
                name: `${payload.gameId} Server`,
                gameId: payload.gameId,
                port: 25565,
                settings: payload.settings
            } as ServerInstance,
            message: "Server instance created successfully"
        };
    }
}