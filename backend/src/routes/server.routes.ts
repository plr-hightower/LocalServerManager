import { Router } from "express";
import { NextFunction, Request,Response } from "express";
import { serverController } from "../controllers/server.controller.js";
import { CreateServerRequestSchema, DeleteServerRequestSchema, RecreateServerRequestSchema, ServerActionSchema, ServerSettingsSchema } from "@hightower/shared";
import { validate } from "../services/validate.service.js";

const router:Router = Router();

// here validator will run before buildserver, interesting shi
router.post("/buildServer" , validate(CreateServerRequestSchema), serverController.buildServer);

router.post("/deleteServer", validate(DeleteServerRequestSchema), serverController.deleteServer);

router.post("/recreateServer", validate(RecreateServerRequestSchema), serverController.recreateServer);

router.post("/status", validate(ServerActionSchema), serverController.changeServerStatus);

router.get("/healthCheck", serverController.getHealthCheck);

router.get("/listServers", serverController.getServerList);

export default router;

