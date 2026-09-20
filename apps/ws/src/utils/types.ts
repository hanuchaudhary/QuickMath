import type WebSocket from "ws";
import type { GameConfig, GameType } from "@matix/common";
import type { Difficulty } from "./math";

export type User = {
  id: string;
  username: string;
  avatar: string;
  socket: WebSocket;
};

export type GameRoom = {
  id: string;
  gameType: GameType;
  gameConfig: GameConfig;
  players: string[];
  status: "WAITING" | "STARTING" | "PLAYING" | "FINISHED";
  
  questions: GameQuestion[];
  
  startedAt: number;
  endsAt: number;

  currentQuestion?: {
    id: string;
    index: number;
    startedAt: number;
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
