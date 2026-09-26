import type WebSocket from "ws";
import type { GameConfig, GameMode, GameType } from "@matix/common";
import type { Difficulty, Question } from "./math";

export type User = {
  id: string;
  username: string;
  avatar: string;
  socket: WebSocket;
};

export type GameRoom = {
  id: string;
  gameType: GameType;
  gameMode: GameMode;
  gameConfig: GameConfig;
  players: string[];
  status: "WAITING" | "STARTING" | "PLAYING" | "FINISHED";

  questions: Question[];

  startedAt?: number;
  endedAt?: number;

  currentQuestion?: {
    id: number;
    index: number;
    answer?: number;
    answeredBy: string | null;
    startedAt: Date;
  };
};

export type GameQuestion = {
  id: number;
  question: string;
  answer: number;
  difficulty: Difficulty;
};

export type GameAnswer = {
  questionId: number;
  answer: number;
  isCorrect: boolean;
  timeTaken: number;
  playerId: string;
};
