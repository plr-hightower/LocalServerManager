import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export function validate (schema: ZodType): (req:Request, res: Response, next:NextFunction) => void {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if(!result.success){
            res.status(400).json({error: "Invalid body", details: result.error.issues})
            return;
        }
        req.body = result.data;
        next();
    };
}

export function validateQuery (schema: ZodType): (req:Request, res: Response, next:NextFunction) => void {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if(!result.success){
            res.status(400).json({error: "Invalid query", details: result.error.issues})
            return;
        }
        req.query = result.data as any;
        next();
    };
}