import type { GameAnswer, PublicQuestion } from "@quickmath/common";
import { generateQuiz } from "../../../utils/math";
import type { AnswerResult, GameRoom, PlayerState } from "../../../utils/types";

export class SprintDuel {
  prepare(room: GameRoom) {
    const questions = generateQuiz(
      Math.floor(room.gameConfig.timeLimit / 10) * 3,
      room.gameConfig.difficulty,
    );

    room.questions.push(...questions);
    room.currentQuestion = {
      id: room.questions[0]!.id,
      index: 0,
      answeredBy: null,
      startedAt: new Date(),
    };
  }

  publicQuestion(
    room: GameRoom,
    player: PlayerState,
  ): PublicQuestion | undefined {
    const question = room.questions[player.questionIndex];
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

    const question = room.questions[questionId];
    if (!question || player.questionIndex !== questionId) {
      return { ok: false, error: "Question not found" };
    }

    if (answer !== question.answer) {
      return { ok: false };
    }

    player.score++;
    player.answerQuestionIds.push(questionId);
    player.questionIndex++;

    const next = room.questions[player.questionIndex];
    return {
      ok: true,
      scored: true,
      broadcastNext: false,
      nextPublic: next
        ? {
            id: next.id,
            index: next.id,
            kind: "math",
            prompt: next.question,
            answer: next.answer,
          }
        : undefined,
    };
  }
}
