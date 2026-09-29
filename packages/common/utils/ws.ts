import { type GameConfig, type GameMode, type GameType } from "./constants";
import type {
  CreateCustomRoomSchema,
  JoinCustomRoomSchema,
} from "./validations";

export const WsEvent = {
  PlayGame: "PLAY_GAME",
  LeaveGame: "LEAVE_GAME",
  ForfeitGame: "FORFEIT_GAME",
  AnswerQuestion: "ANSWER_QUESTION",
  OnlineUsers: "ONLINE_USERS",
  GameCreated: "GAME_CREATED",
  UserJoinedGameRoom: "USER_JOINED_GAME_ROOM",
  GameReady: "GAME_READY",
  GameClose: "GAME_CLOSE",
  GameStarting: "GAME_STARTING",
  GameReconnected: "GAME_RECONNECTED",
  Questions: "QUESTIONS",
  UserStats: "USER_STATS",
  GameFinished: "GAME_FINISHED",
  Error: "ERROR",
  CreateCustomRoom: "CREATE_CUSTOM_ROOM",
  JoinCustomRoom: "JOIN_CUSTOM_ROOM",
  CustomRoomCreated: "CUSTOM_ROOM_CREATED",
  UserJoinedCustomRoom: "USER_JOINED_CUSTOM_ROOM",
  StartCustomRoom: "START_CUSTOM_ROOM",
  StopCustomRoom: "STOP_CUSTOM_ROOM",
  
  ChallengeUser: "CHALLENGE_USER",
  ChallengeReceived: "CHALLENGE_RECEIVED",
  AcceptChallenge: "ACCEPT_CHALLENGE",
  DeclineChallenge: "DECLINE_CHALLENGE",
  ChallengeAccepted: "CHALLENGE_ACCEPTED",
  ChallengeDeclined: "CHALLENGE_DECLINED",
} as const;

export type WsEvent = (typeof WsEvent)[keyof typeof WsEvent];

export type PublicUser = {
  id: string;
  username: string;
  avatar: string;
};

export type RoundKind = "math" | "mind_snap" | "flash_anzan";
export type RoundPhase = "memorize" | "recall" | "flash" | "answer";

export type PublicQuestion = {
  id: number;
  index: number;
  kind: RoundKind;
  prompt?: string;
  answer?: number;
  grid?: { size: number; cells?: number[]; targetCount?: number };
  sequence?: number[];
  phase?: RoundPhase;
  phaseEndsAt?: number;
};

export type PlayerStat = {
  userId: string;
  score: number;
  answeredCount: number;
};

export type RoomSnapshot = {
  id: string;
  hostId?: string;
  isPrivate: boolean;
  joinCode?: string;
  gameType: GameType;
  gameMode: GameMode;
  gameConfig: GameConfig;
  players: PublicUser[];
  status: "WAITING" | "STARTING" | "PLAYING" | "FINISHED";
  startedAt?: number;
  endedAt?: number;
};

export type GameAnswer = number | number[];

export type ClientMessage =
  | {
      type: typeof WsEvent.PlayGame;
      payload: { gameType: GameType; gameMode?: GameMode };
    }
  | { type: typeof WsEvent.LeaveGame; payload?: { roomId?: string } }
  | { type: typeof WsEvent.ForfeitGame; payload?: { roomId?: string } }
  | {
      type: typeof WsEvent.AnswerQuestion;
      payload: { gameId: string; questionId: number; answer: GameAnswer };
    }
  | {
      type: typeof WsEvent.CreateCustomRoom;
      payload: CreateCustomRoomSchema;
    }
  | {
      type: typeof WsEvent.JoinCustomRoom;
      payload: JoinCustomRoomSchema;
    }
  | {
      type: typeof WsEvent.StartCustomRoom;
      payload: { roomId: string };
    }
  | {
      type: typeof WsEvent.StopCustomRoom;
      payload: { roomId: string };
    };

export type RoomPayload = {
  id: string;
  hostId?: string;
  isPrivate?: boolean;
  joinCode?: string;
  gameType: GameType;
  gameMode: GameMode;
  gameConfig: GameConfig;
  players: PublicUser[];
  status: RoomSnapshot["status"];
  startedAt?: number;
  endedAt?: number;
};

export type RawStat = {
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
  | {
      type: typeof WsEvent.GameReconnected;
      data: RoomPayload & {
        stats: RawStat[];
        question?: PublicQuestion;
      };
    }
  | { type: typeof WsEvent.Questions; data: { question: PublicQuestion } }
  | { type: typeof WsEvent.UserStats; data: RawStat[] }
  | {
      type: typeof WsEvent.GameFinished;
      data: { roomId: string; stats: RawStat[]; winnerId?: string | null };
    }
  | { type: typeof WsEvent.Error; data: string }
  | { type: typeof WsEvent.CustomRoomCreated; data: RoomSnapshot }
  | { type: typeof WsEvent.UserJoinedCustomRoom; data: RoomSnapshot }
  | { type: typeof WsEvent.StopCustomRoom; data: { roomId: string } }
  | { type: typeof WsEvent.StartCustomRoom; data: RoomSnapshot }
  | { type: typeof WsEvent.JoinCustomRoom; data: RoomSnapshot }
  | { type: typeof WsEvent.CreateCustomRoom; data: RoomSnapshot }
  | { type: typeof WsEvent.StartCustomRoom; data: RoomSnapshot };

export function toPublicQuestion(question: PublicQuestion): PublicQuestion {
  return question;
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

export type RoomChallenge = {
  id: string;
  challenger: PublicUser;
  challenged: PublicUser;
  gameType: GameType;
  gameMode: GameMode;
  createdAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
};