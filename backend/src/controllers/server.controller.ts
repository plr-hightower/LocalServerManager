import type { NextFunction, Request,Response } from "express";
import {CoreServerSettingsSchema,CoreServerSettingsS,GameE,GameEnum, ServerSettingsS, ServerSettingsSchema} from "../schemas/server.schema";
import path from 'path';
import {createContainer,stopContainer} from '../services/docker.service';
import type { error } from "console";


import { IGameService } from "../interfaces/IGameService";
import { GameManifestS } from "../schemas/game.schema";



const buildServer = async (req:Request, res:Response) => {
    try {

        
        const settings:ServerSettingsS = ServerSettingsSchema.parse(req.body);
        console.log("successfully parsed");
        // TODO: handle error from the coreserversettings in the validator

        // DB ENTRY TODO

        // Here we extract what game it is
        const game:GameE = settings.core_settings.game_contrainer;

        // Here we import the game specific module from which we eventually get the game manifest
        const module = await import(`../services/games/${game}.service.ts`);

        //Making sure that it respects the interface
        const gameService = module.GameService as IGameService;

        console.log("hoooo close gang")

        settings.core_settings.default_host_port = gameService.getDefaultPort();
        //Here we get the game specific env variables
        const result: GameManifestS = await gameService.getManifest(settings);
        // What I should do is have a func that returns the default port for that specific game to later be mapped in the docker container instantiation


        settings.core_settings.container_id = await createContainer(settings,result);



        //DB entry TODO

    } catch (err: any) {
        console.error("", err.message);

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
    buildServer
}