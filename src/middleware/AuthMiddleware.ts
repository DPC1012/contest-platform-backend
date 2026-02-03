import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
interface tokenCheck{
    id: number,
    role: string
}
const { verify } = jwt;
export const AuthCheck = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization as string;
    if(!authorization)
    {
        return res.status(401).json({
            success: false,
            data: null,
            error: "UNAUTHORIZED"
        })
    }
    const token = authorization.startsWith("Bearer ")? authorization.split(" ")[1] : authorization;
    if(!token)
    {
        return res.status(401).json({
        success: false,
        data: null,
        error: "UNAUTHORIZED"
    })
    }
      try {
    const decodedToken = verify(
      token,
      process.env.JWT_SECRET as string
    ) as tokenCheck;

    req.userId = decodedToken.id;
    req.role = decodedToken.role;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "UNAUTHORIZED",
    });
  }
}