import { create } from "zustand";
import {
  GameType,
  WsEvent,
  toPlayerStats,
  toPublicQuestion,
  winnerIdFromStats,
  type GameType as GameTypeName,
  type GameMode,
  type PlayerStat,
  type PublicQuestion,
  type PublicUser,
  type RoomSnapshot,
  type ServerMessage,
} from "@quickmath/common";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080";

type GameState = {
  socket: WebSocket | null;
  connected: boolean;
  onlineUsers: PublicUser[];
  room: RoomSnapshot | null;
  question: PublicQuestion | null;
  stats: PlayerStat[];
  winnerId: string | null;
  error: string | null;
  lastShakeAt: number;
  connect: (token: string) => void;
  disconnect: () => void;
  joinQueue: (gameType: GameTypeName, gameMode?: GameMode) => void;
  leaveQueue: () => void;
  answer: (value: number) => void;
  clearError: () => void;
  resetMatch: () => void;
};

function applyRoom(data: RoomSnapshot, extras: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return { ...data, ...extras };
}

function applyMessage(set: (partial: Partial<GameState>) => void, get: () => GameState, message: ServerMessage) {
  switch (message.type) {
    case WsEvent.OnlineUsers:
      set({ onlineUsers: message.data });
      break;
    case WsEvent.GameCreated:
    case WsEvent.UserJoinedGameRoom:
    case WsEvent.GameReady:
      set({
        room: applyRoom(message.data),
        winnerId: null,
        error: null,
      });
      break;
    case WsEvent.GameClose:
      set({
        room: applyRoom(message.data),
        winnerId: null,
        error: null,
        question: null,
      });
      break;
    case WsEvent.GameStarting: {
      const now = Date.now();
      const timeLimit = message.data.gameConfig.timeLimit * 1000;
      set({
        room: applyRoom(message.data, {
          status: "PLAYING",
          startedAt: now,
          endedAt: now + timeLimit,
        }),
        winnerId: null,
        error: null,
      });
      break;
    }
    case WsEvent.Questions:
      set({ question: toPublicQuestion(message.data.question), error: null });
      break;
    case WsEvent.UserStats:
      set({ stats: toPlayerStats(message.data) });
      break;
    case WsEvent.GameFinished: {
      const stats = toPlayerStats(message.data.stats);
      set({
        winnerId: winnerIdFromStats(stats),
        stats,
        room: get().room
          ? { ...get().room!, status: "FINISHED" }
          : get().room,
      });
      break;
    }
    case WsEvent.Error:
      set({
        error: message.payload,
        lastShakeAt:
          message.payload === "Question already answered" ||
          message.payload === "Question not found"
            ? Date.now()
            : get().lastShakeAt,
      });
      break;
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  connected: false,
  onlineUsers: [],
  room: null,
  question: null,
  stats: [],
  winnerId: null,
  error: null,
  lastShakeAt: 0,
  connect: (token) => {
    const current = get().socket;
    if (current && (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

    socket.onopen = () => set({ connected: true, socket });
    socket.onclose = () => {
      if (get().socket === socket) {
        set({ connected: false, socket: null });
      }
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        applyMessage(set, get, message);
      } catch {
        // ignore malformed frames
      }
    };

    set({ socket });
  },
  disconnect: () => {
    get().socket?.close();
    set({
      socket: null,
      connected: false,
      room: null,
      question: null,
      stats: [],
      winnerId: null,
    });
  },
  joinQueue: (gameType, gameMode) => {
    get().socket?.send(
      JSON.stringify({ type: WsEvent.PlayGame, payload: { gameType, gameMode } }),
    );
  },
  leaveQueue: () => {
    const roomId = get().room?.id;
    get().socket?.send(
      JSON.stringify({ type: WsEvent.LeaveGame, payload: { roomId } }),
    );
    set({ room: null, question: null, stats: [], winnerId: null });
  },
  answer: (value) => {
    const { room, question, socket } = get();
    if (!room || !question || !socket) return;
    const previousId = question.id;
    socket.send(
      JSON.stringify({
        type: WsEvent.AnswerQuestion,
        payload: { gameId: room.id, questionId: question.id, answer: value },
      }),
    );
    window.setTimeout(() => {
      const next = get().question;
      if (next && next.id === previousId && get().room?.status === "PLAYING") {
        set({ lastShakeAt: Date.now() });
      }
    }, 120);
  },
  clearError: () => set({ error: null }),
  resetMatch: () =>
    set({ room: null, question: null, stats: [], winnerId: null, error: null }),
}));

export { GameType };
