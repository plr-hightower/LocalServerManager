import { Router } from "express";
import { NextFunction, Request,Response } from "express";


import Docker, { Container } from 'dockerode';
import { serverController } from "../controllers/server.controller";
import { CreateServerRequestSchema, ServerSettingsSchema } from "@hightower/shared";
import { validate } from "../services/validate.service";
const docker = new Docker();
const router:Router = Router();
// here validator will run before buildserver, interesting shi
router.post("/buildServer" ,validate(CreateServerRequestSchema), serverController.buildServer);

router.get("/:id/status",
    //TODO
    async (req:Request,res:Response) => {
        res.status(200).json({
            goon: req.params.id
        })
    }
)

router.get("/listServers", serverController.getServerList);

router.get("/:id/start",
    //TODO
    async(req:Request, res:Response) =>{
        res.status(200).json({
            update: "start"
        })
    }
)
router.get("/:id/stop",
    //TODO
    async(req:Request, res:Response) =>{
        res.status(200).json({
            update: "stop"
        })
    }
)
export default router;

