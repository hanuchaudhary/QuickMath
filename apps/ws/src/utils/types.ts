import type WebSocket from "ws";
import type {
  GameAnswer,
  GameConfig,
  GameMode,
  GameType,
  PublicQuestion,
} from "@quickmath/common";
import type { Difficulty, Question } from "./math";

export type RoomStatus = "WAITING" | "STARTING" | "PLAYING" | "FINISHED";

export type User = {
  id: string;
  username: string;
  avatar: string;
  socket: WebSocket;
  connected: boolean;
};

export type PlayerState = {
  userId: string;
  questionIndex: number;
  score: number;
  answerQuestionIds: number[];
  memoryPhase?: "memorize" | "recall";
  memoryPhaseEndsAt?: number;
  memoryStartedAt?: number;
};

export type MemoryCell = {
  id: number;
  value: 0 | 1;
};

export type MemoryPuzzle = {
  size: number;
  cells: MemoryCell[];
};

export type MindSnapRound = {
  kind: "mind_snap";
  size: number;
  cells: MemoryCell[];
  phase: "memorize" | "recall";
  phaseEndsAt: number;
  submitted: string[];
};

export type FlashAnzanRound = {
  kind: "flash_anzan";
  sequence: number[];
  sum: number;
  phase: "flash" | "answer";
  phaseEndsAt: number;
};

export type MemoryRound = MindSnapRound | FlashAnzanRound;

export type GameRoom = {
  id: string;
  gameType: GameType;
  gameMode: GameMode;
  gameConfig: GameConfig;

  hostId: string;
  isPrivate: boolean;
  joinCode?: string;

  players: string[];
  status: RoomStatus;
  questions: Question[];
  memoryPuzzles?: MemoryPuzzle[];
  memoryRound?: MemoryRound;
  startedAt?: number;
  endedAt?: number;
  currentQuestion?: {
    id: number;
    index: number;
    answeredBy: string | null;
    startedAt: Date;
  };
  startTimer?: ReturnType<typeof setTimeout>;
  endTimer?: ReturnType<typeof setTimeout>;
  phaseTimer?: ReturnType<typeof setTimeout>;
  playerPhaseTimers?: Map<string, ReturnType<typeof setTimeout>>;
  gcTimer?: ReturnType<typeof setTimeout>;
};

export type GameQuestion = {
  id: number;
  question: string;
  answer: number;
  difficulty: Difficulty;
};

export type AnswerResult = {
  ok: boolean;
  error?: string;
  nextPublic?: PublicQuestion;
  broadcastNext?: boolean;
  restartPlayerPhase?: boolean;
  finish?: boolean;
  scored?: boolean;
};

export type PhaseContext = {
  broadcast: (message: unknown) => void;
  send: (userId: string, message: unknown) => void;
  schedulePhase: (fn: () => void, ms: number) => void;
  clearPhase: () => void;
  scheduleFor: (userId: string, fn: () => void, ms: number) => void;
  clearFor: (userId: string) => void;
};

export interface GameModeHandler {
  prepare(room: GameRoom): void;
  publicQuestion(room: GameRoom, player: PlayerState): PublicQuestion | undefined;
  answer(
    room: GameRoom,
    player: PlayerState,
    answer: GameAnswer,
    questionId: number,
  ): AnswerResult;
  startPhases?(room: GameRoom, ctx: PhaseContext): void;
  startPlayerPhase?(
    room: GameRoom,
    player: PlayerState,
    ctx: PhaseContext,
  ): void;
}
