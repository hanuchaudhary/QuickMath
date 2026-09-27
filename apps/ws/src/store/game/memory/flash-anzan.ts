import type { GameAnswer, PublicQuestion } from "@quickmath/common";
import { generateScore } from "../../../utils/lib";
import { generateFlashAnzan } from "../../../utils/memory";
import type {
  AnswerResult,
  GameRoom,
  PhaseContext,
  PlayerState,
} from "../../../utils/types";

const FLASH_MS = 700;
const SEQUENCE_LENGTH = 6;

export class FlashAnzanDuel {
  prepare(room: GameRoom) {
    this.nextRound(room, 0);
  }

  publicQuestion(room: GameRoom): PublicQuestion | undefined {
    const round = room.memoryRound;
    if (!round || round.kind !== "flash_anzan" || !room.currentQuestion) {
      return undefined;
    }
    return {
      id: room.currentQuestion.id,
      index: room.currentQuestion.index,
      kind: "flash_anzan",
      sequence: round.phase === "flash" ? round.sequence : undefined,
      phase: round.phase,
      phaseEndsAt: round.phaseEndsAt,
    };
  }

  startPhases(room: GameRoom, ctx: PhaseContext) {
    const round = room.memoryRound;
    if (!round || round.kind !== "flash_anzan") {
      return;
    }
    ctx.clearPhase();
    const flashMs = round.sequence.length * FLASH_MS;
    round.phase = "flash";
    round.phaseEndsAt = Date.now() + flashMs;
    ctx.broadcast({
      type: "QUESTIONS",
      data: { question: this.publicQuestion(room) },
    });
    ctx.schedulePhase(() => {
      if (room.status !== "PLAYING") {
        return;
      }
      if (!room.memoryRound || room.memoryRound.kind !== "flash_anzan") {
        return;
      }
      room.memoryRound.phase = "answer";
      if (room.currentQuestion) {
        room.currentQuestion.answeredBy = null;
        room.currentQuestion.startedAt = new Date();
      }
      ctx.broadcast({
        type: "QUESTIONS",
        data: { question: this.publicQuestion(room) },
      });
    }, flashMs);
  }

  answer(
    room: GameRoom,
    player: PlayerState,
    answer: GameAnswer,
    questionId: number,
  ): AnswerResult {
    const round = room.memoryRound;
    const current = room.currentQuestion;
    if (!round || round.kind !== "flash_anzan" || !current) {
      return { ok: false, error: "Question not found" };
    }
    if (current.id !== questionId) {
      return { ok: false, error: "Question not found" };
    }
    if (round.phase !== "answer") {
      return { ok: false, error: "Question not found" };
    }
    if (current.answeredBy !== null) {
      return { ok: false, error: "Question already answered" };
    }
    if (typeof answer !== "number" || answer !== round.sum) {
      return { ok: false };
    }

    current.answeredBy = player.userId;
    player.score += generateScore(
      Math.max(Date.now() - current.startedAt.getTime(), 1),
    );
    player.answerQuestionIds.push(questionId);
    player.questionIndex = current.index + 1;

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
    const { sequence, sum } = generateFlashAnzan(SEQUENCE_LENGTH);
    room.memoryRound = {
      kind: "flash_anzan",
      sequence,
      sum,
      phase: "flash",
      phaseEndsAt: Date.now() + sequence.length * FLASH_MS,
    };
    room.currentQuestion = {
      id: index,
      index,
      answeredBy: null,
      startedAt: new Date(),
    };
  }
}
