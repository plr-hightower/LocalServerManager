import type { NextFunction, Request,Response } from "express";

import { IGameService } from "../interfaces/IGameService.js";
import { CreateServerRequestS, CreateServerRequestSchema, DeleteServerRequestS, DeleteServerRequestSchema, GameE, GameManifestS, HealthCheckResponseS, HealthCheckResponseSchema, ServerActionSchema, ServerSettingsS, ServerSettingsSchema, StatusE, StatusEnum } from '@hightower/shared';
import { DbService } from "../repository/db.repository.js";
import { success, ZodError } from "zod";
import { createContainer, deleteContainer, getDockerStats, startContainer, stopContainer } from "../services/docker.service.js";



const buildServer = async (req:Request, res:Response) => {
    try {

        const db = new DbService();

        const requestSettings:CreateServerRequestS = CreateServerRequestSchema.parse(req.body);
        console.log("successfully parsed");

        const settings:ServerSettingsS =  ServerSettingsSchema.parse({
        ...requestSettings,
        core_settings: {
            ...requestSettings.core_settings,
            container_id: "NOT GENERATED",
            status: "starting",
            created_at: new Date(),
            host_port: null,
            default_host_port: "NOT IMPLEMENTED",
        }
        });
        // ServerID is set automatically by db



        if(await db.getServerByName(settings.core_settings.name) !== null){
            //Find the proper status eventually
            return res.status(400).json("Server name already exists");
        }


        // Here we extract what game it is
        const game:GameE = settings.core_settings.game_container;

        // Here we import the game specific module from which we eventually get the game manifest
        const module = await import(`../services/games/${game}.service.js`);

        //Making sure that it respects the interface
        const gameService = module.GameService as IGameService;

        console.log("hoooo close gang");

        settings.core_settings.default_host_port = gameService.getDefaultPort();
        settings.core_settings.host_port = gameService.getHostPort((await db.getServersByGame(game)).length);

        //Here we get the game specific env variables
        const result: GameManifestS = await gameService.getManifest(settings);
        // What I should do is have a func that returns the default port for that specific game to later be mapped in the docker container instantiation


        settings.core_settings.container_id = await createContainer(settings,result);

        const insertId:number = await db.logNewServer(settings);
        console.log(insertId);
        res.status(200).json(insertId);


    } catch (err: unknown) {
        console.error("", err);

        if( err instanceof ZodError){
            return res.status(400).json({error: "Invalid request body.", details: err.issues })
        }

        res.status(500).json({ 
            error: "Failed to create Minecraft server", 
            details: err
        });
    }
} 

const changeServerStatus = async (req: Request, res: Response) => {
    try {
        const { name, action }: { name: string, action: StatusE} = ServerActionSchema.parse(req.body);

        const db: DbService = new DbService();
        const serverSettings: ServerSettingsS | null = await db.getServerByName(name);

        if (serverSettings === null) {
            return res.status(404).json({ error: "Server not found" });
        }

        const containerId = serverSettings.core_settings.container_id;

        if (action === "starting" || action === "started") {
            await startContainer(containerId);
            await db.updateServerStatus(serverSettings.core_settings.server_id!, "started");
        } else if (action === "stopped" || action === "stopping"){
            await stopContainer(containerId);
            await db.updateServerStatus(serverSettings.core_settings.server_id!, "stopped");
        } else {
            return res.status(400).json({ error: "Invalide action"});
        }

        return res.status(200).json({ success: true });

    } catch (err: unknown) {
        if (err instanceof ZodError) {
            return res.status(400).json({ error: "Invalid request.", details: err.issues });
        }
        if (err instanceof Error) {
            return res.status(500).json({ error: "Failed to change server status", details: err.message });
        }
        res.status(500).json({ error: "Unknown error" });
    }
}
const getHealthCheck = async (req: Request, res: Response) => {
    try {
        const db: DbService = new DbService();

        const [allServers, runningServers, containerStats] = await Promise.all([
            db.getAllServers(),
            db.getServersByStatus("started"),
            getDockerStats(await db.getAllServers()),
        ]);

        const response: HealthCheckResponseS = HealthCheckResponseSchema.parse({
            servers: {
                total: allServers.length,
                running: runningServers.length,
                available: allServers.length - runningServers.length,
            },
            containers: containerStats,
        });

        return res.status(200).json(response);

    } catch (err: unknown) {
        if (err instanceof Error) {
            return res.status(500).json({
                error: "Failed to get health check",
                details: err.message,
            });
        }
        res.status(500).json({ error: "Unknown error" });
    }
}
const deleteServer = async (req:Request, res:Response) => {
    try{
        const request: DeleteServerRequestS = DeleteServerRequestSchema.parse(req.body);
        const db:DbService = new DbService();


        const serverSettings:ServerSettingsS | null = await db.getServerByName(request.name);
        if( serverSettings === null || !serverSettings.core_settings.server_id){
            return res.status(404);
        }
        await deleteContainer(serverSettings.core_settings.container_id);

        await db.deleteServerRow(serverSettings.core_settings.server_id);
        res.status(200).json({success: true});
        return;

    } catch (err:any) {
        console.log(`Error deleting server: ${err}`);

        if( err instanceof ZodError){
            return res.status(400).json({error: "Invalid request body.", details: err.issues })
        }

        res.status(500).json({ 
            error: "Failed to delete Minecraft server", 
            details: err
        });
    }
}

const getServerList = async (req:Request, res:Response) => {
    try {
        const db:DbService = new DbService();
        res.status(200).json(await db.getServerList());

    } catch(err:any) {

        // If container name already exists, Docker returns 409
        if (err.statusCode === 409) {
        return res.status(409).json({ error: `The name "${req.body.name}" is already in use.` });
        }

        // Generic Internal Error
        res.status(500).json({ 
        error: "Failed to create Minecraft server", 
        details: err.message 
        });
    }
}
export const serverController = {
    changeServerStatus,
    buildServer,
    deleteServer,
    getServerList,
    getHealthCheck
}