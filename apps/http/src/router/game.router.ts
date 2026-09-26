import { Router, type Request, type Response } from "express";
import { prisma } from "@matix/db";
import { authMiddleware } from "../utils/middleware";

export const gameRouter = Router();

gameRouter.use(authMiddleware);

function serializeGame(
  game: {
    id: string;
    type: string;
    mode?: string;
    status: string;
    startedAt: Date | null;
    endedAt: Date | null;
    timeLimit: number;
    createdAt: Date;
    players: {
      score: number;
      questionsAnswered: number;
      user: { id: string; username: string; avatar: string };
    }[];
  },
  userId: string,
) {
  const me = game.players.find((p) => p.user.id === userId);
  const opponents = game.players.filter((p) => p.user.id !== userId);

  return {
    id: game.id,
    type: game.type,
    mode: "mode" in game ? game.mode : "DEFAULT",
    status: game.status,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    timeLimit: game.timeLimit,
    createdAt: game.createdAt,
    score: me?.score ?? 0,
    questionsAnswered: me?.questionsAnswered ?? 0,
    opponents: opponents.map((p) => ({
      id: p.user.id,
      username: p.user.username,
      avatar: p.user.avatar,
      score: p.score,
    })),
  };
}

gameRouter.get("/", async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      where: { players: { some: { userId: req.user!.id } } },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.status(200).json({
      games: games.map((game) => serializeGame(game, req.user!.id)),
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});

gameRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const game = await prisma.game.findFirst({
      where: {
        id: req.params.id as string,
        players: { some: { userId: req.user!.id } },
      },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
        questions: {
          orderBy: { index: "asc" },
        },
      },
    });

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    res.status(200).json({
      game: {
        ...serializeGame(game, req.user!.id),
        questions:
          game.status === "FINISHED"
            ? game.questions.map((q) => ({
                index: q.index,
                question: q.question,
                answer: q.answer,
                difficulty: q.difficulty,
              }))
            : game.questions.map((q) => ({
                index: q.index,
                question: q.question,
                difficulty: q.difficulty,
              })),
      },
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});
