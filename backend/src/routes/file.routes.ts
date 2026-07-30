import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import { validate } from '../services/validate.service.js';
import { FileListRequestSchema, FileDeleteRequestSchema } from '@hightower/shared';
import { fileController } from '../controllers/file.controller.js';

const maxUploadFileMb = Number(process.env.MAX_UPLOAD_FILE_MB ?? 32768);
const upload = multer({ dest: os.tmpdir(), limits: { fileSize: maxUploadFileMb * 1024 * 1024 } });
const router = Router();

router.post("/list", validate(FileListRequestSchema), fileController.listFiles);

router.post("/delete", validate(FileDeleteRequestSchema), fileController.deleteFiles);

router.post("/upload", (req, res, next) => {
    upload.array("files")(req, res, (err: unknown) => {
        if (err) {
            return res.status(400).json({ error: "Upload failed", details: err instanceof Error ? err.message : String(err) });
        }
        next();
    });
}, fileController.uploadFiles);

export default router;
