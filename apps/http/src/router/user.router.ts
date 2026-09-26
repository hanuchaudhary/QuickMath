import { Router, type Request, type Response } from "express";
import { prisma } from "@quickmath/db";
import { updateProfileSchema } from "@quickmath/common";
import { authMiddleware } from "../utils/middleware";
import { serializeGame } from "./game.router";

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

userRouter.get("/:username", async (req: Request, res: Response) => {
  try {
    const username = decodeURIComponent(req.params.username as string).trim();
    const profile = await prisma.user.findUnique({
      where: { username },
    });
    if (!profile) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isOwner = profile.id === req.user!.id;
    const payload: {
      user: {
        id: string;
        username: string;
        avatar: string;
        email?: string;
      };
      stats: { gamesPlayed: number; wins: number; totalScore: number };
      games: ReturnType<typeof serializeGame>[];
    } = {
      user: {
        id: profile.id,
        username: profile.username,
        avatar: profile.avatar,
        ...(isOwner ? { email: profile.email } : {}),
      },
      stats: { gamesPlayed: 0, wins: 0, totalScore: 0 },
      games: [],
    };

    try {
      const players = await prisma.gamePlayer.findMany({
        where: { userId: profile.id },
        select: {
          score: true,
          questionsAnswered: true,
          game: {
            select: {
              id: true,
              type: true,
              mode: true,
              status: true,
              startedAt: true,
              endedAt: true,
              timeLimit: true,
              createdAt: true,
              players: {
                select: {
                  score: true,
                  questionsAnswered: true,
                  user: {
                    select: { id: true, username: true, avatar: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
        take: 20,
      });

      const finished = players.filter((p) => p.game.status === "FINISHED");
      payload.stats = {
        gamesPlayed: players.length,
        wins: finished.filter((p) =>
          p.game.players.every(
            (other) => other.user.id === profile.id || other.score < p.score,
          ),
        ).length,
        totalScore: players.reduce((sum, p) => sum + p.score, 0),
      };
      payload.games = players.map((p) => serializeGame(p.game, profile.id));
    } catch (err) {
      console.error("Profile games lookup failed", err);
      try {
        const rows = await prisma.gamePlayer.findMany({
          where: { userId: profile.id },
          select: { score: true },
        });
        payload.stats = {
          gamesPlayed: rows.length,
          wins: 0,
          totalScore: rows.reduce((sum, row) => sum + row.score, 0),
        };
      } catch (statsErr) {
        console.error("Profile stats lookup failed", statsErr);
      }
    }

    res.status(200).json(payload);
  } catch (err) {
    console.error("Profile lookup failed", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
