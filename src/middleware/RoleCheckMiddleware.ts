import type { NextFunction, Request, Response } from "express";

type Role = string;
export const VerifyRole = (role: Role) => { 
    return (req: Request, res: Response, next: NextFunction) => {
        if(req.role != role)
        return res.status(403).json({
            success: false,
            data:null,
            error: "FORBIDDEN"
        })
        next();
    };
};