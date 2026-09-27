import type { GameAnswer, PublicQuestion } from "@quickmath/common";
import { generateScore } from "../../../utils/lib";
import { getMemoryPuzzle } from "../../../utils/memory";
import type {
  AnswerResult,
  GameRoom,
  PhaseContext,
  PlayerState,
} from "../../../utils/types";

const GRID_SIZE = 4;
const MEMORIZE_MS = 2500;

export class MindSnapDuel {
  prepare(room: GameRoom) {
    this.nextRound(room, 0);
  }

  publicQuestion(room: GameRoom): PublicQuestion | undefined {
    const round = room.memoryRound;
    if (!round || round.kind !== "mind_snap" || !room.currentQuestion) {
      return undefined;
    }
    const lit = round.cells.filter((cell) => cell.value === 1).map((cell) => cell.id);
    const reveal = round.phase === "memorize";
    return {
      id: room.currentQuestion.id,
      index: room.currentQuestion.index,
      kind: "mind_snap",
      grid: {
        size: round.size,
        cells: reveal ? lit : undefined,
        targetCount: lit.length,
      },
      phase: round.phase,
      phaseEndsAt: round.phaseEndsAt,
    };
  }

  startPhases(room: GameRoom, ctx: PhaseContext) {
    const round = room.memoryRound;
    if (!round || round.kind !== "mind_snap") {
      return;
    }
    ctx.clearPhase();
    round.phase = "memorize";
    round.submitted = [];
    round.phaseEndsAt = Date.now() + MEMORIZE_MS;
    ctx.broadcast({
      type: "QUESTIONS",
      data: { question: this.publicQuestion(room) },
    });
    ctx.schedulePhase(() => {
      if (room.status !== "PLAYING") {
        return;
      }
      if (!room.memoryRound || room.memoryRound.kind !== "mind_snap") {
        return;
      }
      room.memoryRound.phase = "recall";
      room.memoryRound.submitted = [];
      if (room.currentQuestion) {
        room.currentQuestion.answeredBy = null;
        room.currentQuestion.startedAt = new Date();
      }
      ctx.broadcast({
        type: "QUESTIONS",
        data: { question: this.publicQuestion(room) },
      });
    }, MEMORIZE_MS);
  }

  answer(
    room: GameRoom,
    player: PlayerState,
    answer: GameAnswer,
    questionId: number,
  ): AnswerResult {
    const round = room.memoryRound;
    const current = room.currentQuestion;
    if (!round || round.kind !== "mind_snap" || !current) {
      return { ok: false, error: "Question not found" };
    }
    if (current.id !== questionId) {
      return { ok: false, error: "Question not found" };
    }
    if (round.phase !== "recall") {
      return { ok: false, error: "Question not found" };
    }
    if (round.submitted.includes(player.userId)) {
      return { ok: false, error: "Question already answered" };
    }
    if (!Array.isArray(answer)) {
      return { ok: false };
    }

    const expected = new Set(
      round.cells.filter((cell) => cell.value === 1).map((cell) => cell.id),
    );
    const unique = [...new Set(answer)];
    if (unique.length !== expected.size) {
      return { ok: false };
    }

    const correct = unique.filter((id) => expected.has(id)).length;
    const timeTaken = Math.max(Date.now() - current.startedAt.getTime(), 1);
    player.score += correct * generateScore(timeTaken);
    player.answerQuestionIds.push(questionId);
    player.questionIndex = current.index + 1;
    round.submitted.push(player.userId);

    const waiting = room.players.some((id) => !round.submitted.includes(id));
    if (waiting) {
      return { ok: true, scored: true };
    }

    const nextIndex = current.index + 1;
    if (nextIndex >= room.gameConfig.questionsCount) {
      return { ok: true, scored: true, finish: true };
    }

    this.nextRound(room, nextIndex);
    return {
      ok: true,
      scored: true,
      broadcastNext: true,
      nextPublic: this.publicQuestion(room),
    };
  }

  private nextRound(room: GameRoom, index: number) {
    const cells = getMemoryPuzzle(GRID_SIZE);
    room.memoryRound = {
      kind: "mind_snap",
      size: GRID_SIZE,
      cells,
      phase: "memorize",
      phaseEndsAt: Date.now() + MEMORIZE_MS,
      submitted: [],
    };
    room.currentQuestion = {
      id: index,
      index,
      answeredBy: null,
      startedAt: new Date(),
    };
  }
}
