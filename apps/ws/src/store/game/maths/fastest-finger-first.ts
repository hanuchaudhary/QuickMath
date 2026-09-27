import type { GameAnswer, PublicQuestion } from "@quickmath/common";
import { generateScore } from "../../../utils/lib";
import { generateQuiz } from "../../../utils/math";
import type {
  AnswerResult,
  GameRoom,
  PlayerState,
} from "../../../utils/types";

export class FastestFingerFirst {
  prepare(room: GameRoom) {
    room.questions = generateQuiz(
      room.gameConfig.questionsCount,
      room.gameConfig.difficulty,
    );
    room.currentQuestion = {
      id: room.questions[0]!.id,
      index: 0,
      answeredBy: null,
      startedAt: new Date(),
    };
  }

  publicQuestion(room: GameRoom): PublicQuestion | undefined {
    const current = room.currentQuestion;
    if (!current) {
      return undefined;
    }
    const question = room.questions[current.index];
    if (!question) {
      return undefined;
    }
    return {
      id: question.id,
      index: question.id,
      kind: "math",
      prompt: question.question,
      answer: question.answer,
    };
  }

  answer(
    room: GameRoom,
    player: PlayerState,
    answer: GameAnswer,
    questionId: number,
  ): AnswerResult {
    if (typeof answer !== "number") {
      return { ok: false, error: "Question not found" };
    }

    const currentQuestion = room.currentQuestion;
    if (!currentQuestion || currentQuestion.id !== questionId) {
      return { ok: false, error: "Question not found" };
    }

    if (currentQuestion.answeredBy !== null) {
      return { ok: false, error: "Question already answered" };
    }

    const question = room.questions[currentQuestion.index];
    if (!question || answer !== question.answer) {
      return { ok: false };
    }

    currentQuestion.answeredBy = player.userId;
    player.score += generateScore(
      Math.max(Date.now() - currentQuestion.startedAt.getTime(), 1),
    );
    player.answerQuestionIds.push(questionId);

    const nextIndex = currentQuestion.index + 1;
    const next = room.questions[nextIndex];

    if (!next) {
      return { ok: true, scored: true, finish: true };
    }

    room.currentQuestion = {
      id: next.id,
      index: nextIndex,
      answeredBy: null,
      startedAt: new Date(),
    };

    return {
      ok: true,
      scored: true,
      broadcastNext: true,
      nextPublic: {
        id: next.id,
        index: next.id,
        kind: "math",
        prompt: next.question,
        answer: next.answer,
      },
    };
  }
}
