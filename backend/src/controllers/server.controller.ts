import type { NextFunction, Request,Response } from "express";

import { IGameService } from "../interfaces/IGameService.js";
import { CreateServerRequestS, CreateServerRequestSchema, DeleteServerRequestS, DeleteServerRequestSchema, GameManifestS, HealthCheckResponseS, HealthCheckResponseSchema, ServerActionSchema, ServerSettingsS, ServerSettingsSchema, StatusE, StatusEnum } from '@hightower/shared';
import { DbService } from "../repository/db.repository.js";
import { success, ZodError } from "zod";
import { createContainer, deleteContainer, getDockerStats, startContainer, stopContainer, reconcileStatuses } from "../services/docker.service.js";
import { getGameService, getManifest, getOccupiedPorts } from "../services/game.service.js";
import { hashManagerPassword, verifyManagerPassword, isMasterPassword } from "../services/password.service.js";
import { hasEnoughRam } from "../services/serverHelper.service.js";
import { logger } from "../logger.js";
import { error } from "console";



const buildServer = async (req:Request, res:Response) => {
    try {

        const db = new DbService();

        const requestSettings:CreateServerRequestS = CreateServerRequestSchema.parse(req.body);
        logger.info("Successfully parsed create server request.");

        logger.info({params : requestSettings},`Building server with the following params`);
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

        const maxTotalServers = Number(process.env.MAX_TOTAL_SERVERS ?? 40);
        const maxServersWithinWindow = Number(process.env.MAX_SERVERS_WITHIN_WINDOW ?? 1);
        const window = Number(process.env.CREATE_SERVER_WINDOW_MINUTES ?? 60);
        const timeElapsedSinceBuild = new Date(Date.now() - window * 60 * 1000);

        const bypassLimits = isMasterPassword(requestSettings.admin_password);

        if (await db.countServers() >= maxTotalServers){
            return res.status(429).json({
                error: "Max servers limit reached."
            });
        }
        if (!bypassLimits && await db.countServersSince(timeElapsedSinceBuild) >= maxServersWithinWindow) {
            return res.status(429).json({
                error: `Server creation limit reached: max ${maxServersWithinWindow} per ${window} minute(s).`
            });
        }
        if(await db.getServerByName(settings.core_settings.name) !== null){
            return res.status(400).json({ error: "Server name already exists" });
        }

        const currentUsedMb = await db.sumRamAllocForActiveServers();
        if (!hasEnoughRam(settings.core_settings.ram_alloc_mb, currentUsedMb)) {
            return res.status(400).json({ error: "Not enough RAM available to start this server." });
        }

        // Setting up the settings
        const gameService = await getGameService(settings);

        // Set ports before the manifest, else will not work
        // TODO: make the order irrelevant
        settings.core_settings.default_host_port = gameService.getDefaultPort();
        const occupiedPorts = await getOccupiedPorts(await db.getAllServers());
        settings.core_settings.host_port = gameService.getHostPort(occupiedPorts);

        const manifest: GameManifestS = await gameService.getGameManifest(settings);


        if (settings.core_settings.manager_password) {
            settings.core_settings.manager_password = await hashManagerPassword(settings.core_settings.manager_password);
        }

        settings.core_settings.container_id = await createContainer(settings,manifest);
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
            const currentUsedMb = await db.sumRamAllocForActiveServers();
            if (!hasEnoughRam(serverSettings.core_settings.ram_alloc_mb, currentUsedMb)) {
                return res.status(400).json({ error: "Not enough RAM available to start this server." });
            }

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
            return res.status(404).json({ error: "Server not found" });
        }

        if (!await verifyManagerPassword(serverSettings, request.password)) {
            return res.status(401).json({ error: "Invalid password" });
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
        logger.info("Getting the server list.");
        const db:DbService = new DbService();

        try {
            await reconcileStatuses(db);
        } catch (e) {
            logger.warn({ err: e }, "Status reconcile failed; returning last known statuses");
        }

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