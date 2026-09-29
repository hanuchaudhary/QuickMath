import { create } from "zustand";
import {
  GameType,
  WsEvent,
  toPlayerStats,
  toPublicQuestion,
  winnerIdFromStats,
  type GameType as GameTypeName,
  type GameAnswer,
  type GameMode,
  type PlayerStat,
  type PublicQuestion,
  type PublicUser,
  type RoomSnapshot,
  type ServerMessage,
  type RoomChallenge,
} from "@quickmath/common";
import { useAuthStore } from "./auth.store";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080";

type ResumeOffer = {
  room: RoomSnapshot;
  question: PublicQuestion | null;
  stats: PlayerStat[];
};

type GameState = {
  message: string;
  socket: WebSocket | null;
  connected: boolean;
  hydrated: boolean;
  onlineUsers: PublicUser[];
  room: RoomSnapshot | null;
  question: PublicQuestion | null;
  stats: PlayerStat[];
  winnerId: string | null;
  error: string | null;
  lastShakeAt: number;
  pendingResume: ResumeOffer | null;

  challenges: RoomChallenge[];

  challengeUser: (
    challengedId: string,
    gameType: GameType,
    gameMode: GameMode,
  ) => void;
  acceptChallenge: (challengeId: string) => void;
  removeChallenge: (challengeId: string) => void;
  declineChallenge: (challengeId: string) => void;
  clearPendingChallenges: () => void;

  connect: (token: string) => void;
  disconnect: () => void;
  joinQueue: (gameType: GameTypeName, gameMode?: GameMode) => void;
  leaveQueue: () => void;
  forfeit: () => void;
  resumeMatch: () => void;
  declineResume: () => void;
  answer: (value: GameAnswer) => void;
  clearError: () => void;
  resetMatch: () => void;
  startCustomRoom: (roomId: string) => void;
  stopCustomRoom: (roomId: string) => void;
};

function applyRoom(
  data: RoomSnapshot,
  extras: Partial<RoomSnapshot> = {},
): RoomSnapshot {
  return { ...data, ...extras };
}

function applyMessage(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  message: ServerMessage,
) {
  switch (message.type) {
    case WsEvent.OnlineUsers:
      set({ onlineUsers: message.data, hydrated: true });
      break;
    case WsEvent.GameCreated:
    case WsEvent.UserJoinedGameRoom:
    case WsEvent.GameReady:
      set({
        room: applyRoom(message.data as RoomSnapshot),
        winnerId: null,
        error: null,
        hydrated: true,
        pendingResume: null,
      });
      break;
    case WsEvent.GameClose:
      set({
        room: applyRoom(message.data as RoomSnapshot),
        winnerId: null,
        error: null,
        question: null,
        hydrated: true,
      });
      break;
    case WsEvent.GameStarting:
      set({
        room: applyRoom(message.data as RoomSnapshot, { status: "PLAYING" }),
        winnerId: null,
        error: null,
        hydrated: true,
        pendingResume: null,
      });
      break;
    case WsEvent.Questions:
      set({
        question: toPublicQuestion(message.data.question),
        error: null,
        hydrated: true,
      });
      break;
    case WsEvent.UserStats:
      set({ stats: toPlayerStats(message.data), hydrated: true });
      break;
    case WsEvent.GameFinished: {
      const stats = toPlayerStats(message.data.stats);
      set({
        winnerId:
          message.data.winnerId !== undefined
            ? message.data.winnerId
            : winnerIdFromStats(stats),
        stats,
        room: get().room
          ? { ...get().room!, status: "FINISHED" }
          : get().pendingResume
            ? { ...get().pendingResume!.room, status: "FINISHED" }
            : get().room,
        pendingResume: null,
        hydrated: true,
      });
      break;
    }
    case WsEvent.GameReconnected: {
      const stats = toPlayerStats(message.data.stats ?? []);
      const room = applyRoom(message.data as RoomSnapshot);
      const question = message.data.question
        ? toPublicQuestion(message.data.question)
        : null;
      const current = get().room;
      const sameLiveMatch =
        current?.id === room.id && current.status === "PLAYING";

      if (room.status === "PLAYING" && !sameLiveMatch) {
        set({
          pendingResume: { room, question, stats },
          winnerId: null,
          error: null,
          hydrated: true,
        });
        return;
      }

      set({
        room,
        winnerId: room.status === "FINISHED" ? winnerIdFromStats(stats) : null,
        error: null,
        stats,
        question,
        lastShakeAt: 0,
        hydrated: true,
        pendingResume: null,
      });
      break;
    }

    case WsEvent.CustomRoomCreated:
      {
        set({
          room: applyRoom(message.data),
          winnerId: null,
          error: null,
          hydrated: true,
          pendingResume: null,
        });
      }
      break;
    case WsEvent.JoinCustomRoom:
      set({
        room: applyRoom(message.data),
        winnerId: null,
        error: null,
        hydrated: true,
        pendingResume: null,
      });
      break;
    case WsEvent.UserJoinedCustomRoom:
      set({
        room: applyRoom(message.data),
        winnerId: null,
        error: null,
        hydrated: true,
        pendingResume: null,
      });
      break;
    case WsEvent.StartCustomRoom:
      set({
        room: applyRoom(message.data),
        winnerId: null,
        error: null,
        hydrated: true,
        pendingResume: null,
      });
      break;
    case WsEvent.ExitCustomRoom:
      set({
        room: applyRoom(message.data),
        winnerId: null,
        error: null,
        hydrated: true,
        pendingResume: null,
      });
      break;
    case WsEvent.ChallengeReceived:
      set({
        challenges: [message.data.challenge, ...get().challenges],
        hydrated: true,
      });
      break;

    case WsEvent.ChallengeDeclined:
      set({
        challenges: get().challenges.filter(
          (challenge) => challenge.id !== message.data.challengeId,
        ),
        hydrated: true,
        message: `Challenge declined by ${message.data.challenged.username}`,
      });
      break;

    case WsEvent.ChallengeAccepted:
      set({
        challenges: get().challenges.filter(
          (challenge) => challenge.id !== message.data.challengeId,
        ),
        hydrated: true,
      });
      break;

    case WsEvent.Error:
      set({
        error: message.data,
        hydrated: true,
        lastShakeAt:
          message.data === "Question already answered" ||
          message.data === "Question not found"
            ? Date.now()
            : get().lastShakeAt,
      });
      break;
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  connected: false,
  message: "",
  hydrated: false,
  onlineUsers: [],
  room: null,
  question: null,
  stats: [],
  winnerId: null,
  error: null,
  lastShakeAt: 0,
  pendingResume: null,
  challenges: [],
  connect: (token) => {
    const current = get().socket;
    if (
      current &&
      (current.readyState === WebSocket.OPEN ||
        current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const socket = new WebSocket(
      `${WS_URL}?token=${encodeURIComponent(token)}`,
    );

    socket.onopen = () => set({ connected: true, socket, hydrated: false });
    socket.onclose = () => {
      if (get().socket === socket) {
        set({ connected: false, socket: null, hydrated: false });
      }
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        applyMessage(set, get, message);
      } catch {
        set({ hydrated: true });
      }
    };

    set({ socket, hydrated: false });
  },
  disconnect: () => {
    get().socket?.close();
    set({
      socket: null,
      connected: false,
      hydrated: false,
      room: null,
      question: null,
      stats: [],
      winnerId: null,
      pendingResume: null,
    });
  },
  joinQueue: (gameType, gameMode) => {
    const { room, pendingResume } = get();
    if (pendingResume) return;
    if (room && room.status !== "FINISHED") {
      return;
    }
    get().socket?.send(
      JSON.stringify({
        type: WsEvent.PlayGame,
        payload: { gameType, gameMode },
      }),
    );
  },
  leaveQueue: () => {
    const roomId = get().room?.id;
    get().socket?.send(
      JSON.stringify({ type: WsEvent.LeaveGame, payload: { roomId } }),
    );
    set({ room: null, question: null, stats: [], winnerId: null });
  },
  forfeit: () => {
    const roomId = get().pendingResume?.room.id ?? get().room?.id;
    get().socket?.send(
      JSON.stringify({ type: WsEvent.ForfeitGame, payload: { roomId } }),
    );
  },
  resumeMatch: () => {
    const pending = get().pendingResume;
    if (!pending) return;
    set({
      room: pending.room,
      question: pending.question,
      stats: pending.stats,
      winnerId: null,
      lastShakeAt: 0,
      pendingResume: null,
    });
  },
  declineResume: () => {
    get().forfeit();
    set({
      pendingResume: null,
      room: null,
      question: null,
      stats: [],
      winnerId: null,
    });
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
  startCustomRoom: (roomId: string) => {
    get().socket?.send(
      JSON.stringify({ type: WsEvent.StartCustomRoom, payload: { roomId } }),
    );
  },
  stopCustomRoom: (roomId: string) => {
    get().socket?.send(
      JSON.stringify({ type: WsEvent.ExitCustomRoom, payload: { roomId } }),
    );
  },

  challengeUser: (
    challengedId: string,
    gameType: GameType,
    gameMode: GameMode,
  ) => {
    get().socket?.send(
      JSON.stringify({
        type: WsEvent.ChallengeUser,
        payload: { challengedId, gameType, gameMode },
      }),
    );
  },
  acceptChallenge: (challengeId: string) => {
    get().socket?.send(
      JSON.stringify({
        type: WsEvent.AcceptChallenge,
        payload: { challengeId },
      }),
    );
  },
  declineChallenge: (challengeId: string) => {
    get().socket?.send(
      JSON.stringify({
        type: WsEvent.DeclineChallenge,
        payload: { challengeId },
      }),
    );
  },
  removeChallenge: (challengeId: string) => {
    set({
      challenges: get().challenges.filter(
        (challenge) => challenge.id !== challengeId,
      ),
    });
  },
  clearPendingChallenges: () => set({ challenges: [] }),

  clearError: () => set({ error: null }),
  resetMatch: () =>
    set({
      room: null,
      question: null,
      stats: [],
      winnerId: null,
      error: null,
      pendingResume: null,
    }),
}));

export { GameType };
