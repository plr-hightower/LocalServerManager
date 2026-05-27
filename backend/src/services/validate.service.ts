import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export function validate (schema: ZodType): (req:Request, res: Response, next:NextFunction) => void {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if(!result.success){
            res.status(400).json({error: "Invalide body", details: result.error.issues})
            return;
        }
        req.body = result.data;
        next();
    };
}