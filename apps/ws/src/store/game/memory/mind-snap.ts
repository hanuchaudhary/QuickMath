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
    room.memoryPuzzles = Array.from(
      { length: room.gameConfig.questionsCount },
      () => ({
        size: GRID_SIZE,
        cells: getMemoryPuzzle(GRID_SIZE),
      }),
    );
  }

  publicQuestion(room: GameRoom, player: PlayerState): PublicQuestion | undefined {
    const puzzle = room.memoryPuzzles?.[player.questionIndex];
    if (!puzzle) {
      return undefined;
    }
    const lit = puzzle.cells
      .filter((cell) => cell.value === 1)
      .map((cell) => cell.id);
    const phase = player.memoryPhase ?? "memorize";
    return {
      id: player.questionIndex,
      index: player.questionIndex,
      kind: "mind_snap",
      grid: {
        size: puzzle.size,
        cells: lit,
        targetCount: lit.length,
      },
      phase,
      phaseEndsAt: player.memoryPhaseEndsAt,
    };
  }

  startPlayerPhase(room: GameRoom, player: PlayerState, ctx: PhaseContext) {
    const puzzle = room.memoryPuzzles?.[player.questionIndex];
    if (!puzzle) {
      return;
    }
    ctx.clearFor(player.userId);
    player.memoryPhase = "memorize";
    player.memoryPhaseEndsAt = Date.now() + MEMORIZE_MS;
    player.memoryStartedAt = Date.now();
    const index = player.questionIndex;
    ctx.send(player.userId, {
      type: "QUESTIONS",
      data: { question: this.publicQuestion(room, player) },
    });
    ctx.scheduleFor(
      player.userId,
      () => {
        if (room.status !== "PLAYING") {
          return;
        }
        if (player.questionIndex !== index) {
          return;
        }
        player.memoryPhase = "recall";
        player.memoryStartedAt = Date.now();
        ctx.send(player.userId, {
          type: "QUESTIONS",
          data: { question: this.publicQuestion(room, player) },
        });
      },
      MEMORIZE_MS,
    );
  }

  answer(
    room: GameRoom,
    player: PlayerState,
    answer: GameAnswer,
    questionId: number,
  ): AnswerResult {
    if (player.questionIndex !== questionId) {
      return { ok: false };
    }
    if (player.memoryPhase !== "recall") {
      return { ok: false };
    }
    if (player.answerQuestionIds.includes(questionId)) {
      return { ok: false };
    }
    if (!Array.isArray(answer)) {
      return { ok: false };
    }

    const puzzle = room.memoryPuzzles?.[player.questionIndex];
    if (!puzzle) {
      return { ok: false };
    }

    const expected = new Set(
      puzzle.cells.filter((cell) => cell.value === 1).map((cell) => cell.id),
    );
    const unique = [...new Set(answer)];
    if (unique.length !== expected.size) {
      return { ok: false };
    }

    const correct = unique.filter((id) => expected.has(id)).length;
    const started = player.memoryStartedAt ?? Date.now();
    const timeTaken = Math.max(Date.now() - started, 1);
    player.score += correct * generateScore(timeTaken);
    player.answerQuestionIds.push(questionId);
    player.questionIndex++;

    if (player.questionIndex >= (room.memoryPuzzles?.length ?? 0)) {
      return { ok: true, scored: true };
    }

    return {
      ok: true,
      scored: true,
      restartPlayerPhase: true,
    };
  }
}
