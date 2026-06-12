import { Router } from 'express';
import { validate } from '../services/validate.service.js';
import { WorldRequestSchema } from '@hightower/shared';
import { worldController } from '../controllers/world.controller.js';

const router = Router();

router.post("/download", validate(WorldRequestSchema), worldController.downloadWorld);

export default router;