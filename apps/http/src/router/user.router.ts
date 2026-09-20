import { Router, type Request, type Response } from "express";
import { prisma } from "@matix/db";
import { updateProfileSchema } from "@matix/common";
import { authMiddleware } from "../utils/middleware";

export const userRouter = Router();

userRouter.use(authMiddleware);

userRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.patch("/me", async (req: Request, res: Response) => {
  try {
    const { success, data, error } = updateProfileSchema.safeParse(req.body);
    if (!success) {
      res.status(400).json({ message: error.issues[0]?.message });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        username: data.username,
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
      },
    });

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.get("/me/stats", async (req: Request, res: Response) => {
  try {
    const players = await prisma.gamePlayer.findMany({
      where: { userId: req.user!.id },
      include: {
        game: {
          include: { players: true },
        },
      },
    });

    const finished = players.filter((p) => p.game.status === "FINISHED");
    const wins = finished.filter((p) =>
      p.game.players.every((other) => other.userId === p.userId || other.score < p.score),
    ).length;
    const totalScore = players.reduce((sum, p) => sum + p.score, 0);

    res.status(200).json({
      stats: {
        gamesPlayed: players.length,
        wins,
        totalScore,
      },
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});
