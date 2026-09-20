import { Router, type Request, type Response } from "express";
import { prisma } from "@matix/db";
import { loginSchema, registerSchema } from "@matix/common";
import { comparePassword, generateToken, hashPassword } from "../utils/auth";
import { authMiddleware } from "../utils/middleware";
import { getRandomUsername } from "../utils/lib";

export const authRouter = Router();

authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { success, data, error } = registerSchema.safeParse(req.body);
    if (!success) {
      res.status(400).json({ message: error.issues[0]?.message });
      return;
    }

    const { email, password } = data;
    const hashedPassword = await hashPassword(password);

    const username = email.split("@")[0] || getRandomUsername() || "";

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        avatar: "",
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/signin", async (req: Request, res: Response) => {
  try {
    const { success, data, error } = loginSchema.safeParse(req.body);
    if (!success) {
      res.status(400).json({ message: error.issues[0]?.message });
      return;
    }
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    const token = generateToken({
      id: user.id,
      avatar: user.avatar,
      username: user.username,
    });
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
    });
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    res.status(200).json({
      message: "User found",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
