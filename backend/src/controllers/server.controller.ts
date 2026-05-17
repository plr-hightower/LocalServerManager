import type { NextFunction, Request,Response } from "express";
import path from 'path';
import {createContainer,stopContainer} from '../services/docker.service';
import type { error } from "console";


import { IGameService } from "../interfaces/IGameService";
import { GameE, GameManifestS, ServerSettingsS, ServerSettingsSchema } from '@hightower/shared';
import { DbService } from "../services/db.service";
import { nameToInt } from "../services/serverUtils.service";



const buildServer = async (req:Request, res:Response) => {
    try {

        const db = new DbService();

        const settings:ServerSettingsS = ServerSettingsSchema.parse(req.body);
        console.log("successfully parsed");
        // TODO: handle error from the coreserversettings in the validator


        const candidateServerId:number = nameToInt(settings.core_settings.name);


        if(db.getServerById(candidateServerId) === null){
            //Find the proper status eventually
            res.status(200).json("Server name already exists");
        }

        //Set the server_id
        settings.core_settings.server_id = candidateServerId;

        // Here we extract what game it is
        const game:GameE = settings.core_settings.game_container;

        // Here we import the game specific module from which we eventually get the game manifest
        const module = await import(`../services/games/${game}.service`);

        //Making sure that it respects the interface
        const gameService = module.GameService as IGameService;

        console.log("hoooo close gang")

        settings.core_settings.default_host_port = gameService.getDefaultPort();
        //Here we get the game specific env variables
        const result: GameManifestS = await gameService.getManifest(settings);
        // What I should do is have a func that returns the default port for that specific game to later be mapped in the docker container instantiation


        settings.core_settings.container_id = "gonicideetpesticide";
        //await createContainer(settings,result);

        const insertId:number = await db.createServer(settings);
        console.log(insertId);
        res.status(200).json(insertId);


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
    buildServer,
    getServerList
}