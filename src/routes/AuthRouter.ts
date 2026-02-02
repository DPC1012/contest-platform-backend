import express, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginSchema, SignupSchema } from "../validation/AuthSchema";
import { prisma } from "../db/db";
const AuthRouter = express.Router();
const { sign } = jwt;
AuthRouter.post("/signup", async (req: Request, res: Response) => {
  const { data, success } = SignupSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }
  try {
    // const existingUser = await prisma.user.findUnique({
    //   where: { email: data.email },
    // });
    // if (existingUser) {
    //   return res.status(400).json({
    //     success: false,
    //     data: null,
    //     error: "EMAIL_ALREADY_EXIST",
    //   });
    // }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
    });
    return res.status(201).json({
      success,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      error: null,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "EMAIL_ALREADY_EXISTS",
    });
  }
});

AuthRouter.post("/login", async (req: Request, res: Response) => {
  const { data, success } = LoginSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }
  try {
    const findUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!findUser) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "INVALID_CREDENTIALS",
      });
    }
    const success = await bcrypt.compare(data.password, findUser.password);
    if (!success) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "INVALID_CREDENTIALS",
      });
    }
    const token = sign(
      { id: findUser.id, role: findUser.role },
      process.env.JWT_SECRET as string,
    );
    return res.json({
      success,
      data: {
        token,
      },
      error: null,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_CREDENTIALS",
    });
  }
});

export default AuthRouter;
