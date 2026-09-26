import { GameType, type GameConfig, type GameMode } from "./constants";

export const WsEvent = {
  PlayGame: "PLAY_GAME",
  LeaveGame: "LEAVE_GAME",
  AnswerQuestion: "ANSWER_QUESTION",
  OnlineUsers: "ONLINE_USERS",
  GameCreated: "GAME_CREATED",
  UserJoinedGameRoom: "USER_JOINED_GAME_ROOM",
  GameReady: "GAME_READY",
  GameClose: "GAME_CLOSE",
  GameStarting: "GAME_STARTING",
  Questions: "QUESTIONS",
  UserStats: "USER_STATS",
  GameFinished: "GAME_FINISHED",
  Error: "ERROR",
} as const;

export type WsEvent = (typeof WsEvent)[keyof typeof WsEvent];

export type PublicUser = {
  id: string;
  username: string;
  avatar: string;
};

export type PublicQuestion = {
  id: number;
  index: number;
  prompt: string;
  answer: number;
};

export type PlayerStat = {
  userId: string;
  score: number;
  answeredCount: number;
};

export type RoomSnapshot = {
  id: string;
  gameType: GameType;
  gameMode: GameMode;
  gameConfig: GameConfig;
  players: PublicUser[];
  status: "WAITING" | "STARTING" | "PLAYING" | "FINISHED";
  startedAt?: number;
  endedAt?: number;
};

export type ClientMessage =
  | {
      type: typeof WsEvent.PlayGame;
      payload: { gameType: GameType; gameMode?: GameMode };
    }
  | { type: typeof WsEvent.LeaveGame; payload?: { roomId?: string } }
  | {
      type: typeof WsEvent.AnswerQuestion;
      payload: { gameId: string; questionId: number; answer: number };
    };

type RoomPayload = {
  id: string;
  gameType: GameType;
  gameMode: GameMode;
  gameConfig: GameConfig;
  players: PublicUser[];
  status: RoomSnapshot["status"];
  startedAt?: number;
  endedAt?: number;
};

type RawQuestion = {
  id: number;
  question: string;
  answer: number;
  difficulty: string;
};

type RawStat = {
  userId: string;
  score: number;
  totalAnsweredQuestions?: number;
  answeredCount?: number;
};

export type ServerMessage =
  | { type: typeof WsEvent.OnlineUsers; data: PublicUser[] }
  | { type: typeof WsEvent.GameCreated; data: RoomPayload }
  | { type: typeof WsEvent.UserJoinedGameRoom; data: RoomPayload }
  | { type: typeof WsEvent.GameReady; data: RoomPayload }
  | { type: typeof WsEvent.GameClose; data: RoomPayload & { userId: string } }
  | { type: typeof WsEvent.GameStarting; data: RoomPayload }
  | { type: typeof WsEvent.Questions; data: { question: RawQuestion } }
  | { type: typeof WsEvent.UserStats; data: RawStat[] }
  | {
      type: typeof WsEvent.GameFinished;
      data: { roomId: string; stats: RawStat[] };
    }
  | { type: typeof WsEvent.Error; payload: string };

export function toPublicQuestion(question: RawQuestion): PublicQuestion {
  return {
    id: question.id,
    index: question.id,
    prompt: question.question,
    answer: question.answer,
  };
}

export function toPlayerStats(stats: RawStat[]): PlayerStat[] {
  return stats.map((stat) => ({
    userId: stat.userId,
    score: stat.score,
    answeredCount: stat.answeredCount ?? stat.totalAnsweredQuestions ?? 0,
  }));
}

export function winnerIdFromStats(stats: PlayerStat[]): string | null {
  if (stats.length === 0) return null;
  const top = Math.max(...stats.map((s) => s.score));
  const leaders = stats.filter((s) => s.score === top);
  if (leaders.length !== 1) return null;
  return leaders[0]!.userId;
}
