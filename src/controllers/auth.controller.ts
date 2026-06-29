import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, data: null, message: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, data: null, message: "Invalid credentials" });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jwtOpts = { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" } as any;
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, jwtOpts);

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, name: user.name } },
      message: "Login successful",
    });
  } catch (err) {
    next(err);
  }
}

export async function verify(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(401).json({ success: false, data: null, message: "User not found" });
      return;
    }

    res.json({ success: true, data: { user }, message: "Token valid" });
  } catch (err) {
    next(err);
  }
}
