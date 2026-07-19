import { Router } from 'express';
import { validateQuery } from '../services/validate.service.js';
import { WorldRequestSchema } from '@hightower/shared';
import { worldController } from '../controllers/world.controller.js';

const router = Router();

router.get("/download", validateQuery(WorldRequestSchema), worldController.downloadWorld);

export default router;