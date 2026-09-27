import {
  GAME_MODES_BY_TYPE,
  getGameConfig,
  isGameType,
  resolveGameMode,
  WsEvent,
  type GameAnswer,
  type GameMode,
  type GameType,
  type RawStat,
  type RoomPayload,
} from "@quickmath/common";
import type { GameRoom, PhaseContext, PlayerState, User } from "../utils/types";
import type { RoomManager } from "./room.manager";
import type { UserManager } from "./user.manager";
import type { WsManager } from "./ws.manager";
import { getHandler } from "./game/handlers";

const START_DELAY_MS = 3000;
const FINISH_GC_MS = 60_000;

function emptyPlayer(userId: string): PlayerState {
  return {
    userId,
    questionIndex: 0,
    score: 0,
    answerQuestionIds: [],
  };
}

export class GameManager {
  constructor(
    private roomManager: RoomManager,
    private userManager: UserManager,
    private wsManager: WsManager,
  ) {}

  play(user: User, gameType: unknown, gameMode: unknown) {
    const existing = this.roomManager.getRoomByUser(user.id);
    if (existing?.status === "FINISHED") {
      this.roomManager.removePlayer(existing.id, user.id);
      if (existing.players.length === 0) {
        this.roomManager.deleteRoom(existing.id);
      }
    } else if (
      existing &&
      (existing.status === "WAITING" ||
        existing.status === "STARTING" ||
        existing.status === "PLAYING")
    ) {
      this.reconnect(user);
      return;
    }

    if (!isGameType(gameType)) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Valid game type is required",
      });
      return;
    }

    const allowed = GAME_MODES_BY_TYPE[gameType];
    const mode = resolveGameMode(gameType, gameMode);
    if (!allowed.includes(mode)) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Valid game mode is required",
      });
      return;
    }

    const handler = getHandler(gameType, mode);
    if (!handler) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Game type is not available",
      });
      return;
    }

    const gameConfig = getGameConfig(gameType, mode);
    const available = this.roomManager
      .getRooms()
      .filter(
        (room) =>
          room.gameType === gameType &&
          room.gameMode === mode &&
          room.status === "WAITING" &&
          room.gameConfig.maxPlayersCount > room.players.length,
      )
      .sort((a, b) => a.players.length - b.players.length);

    if (available.length > 0) {
      const room = available[0]!;
      if (!room.players.includes(user.id)) {
        room.players.push(user.id);
      }
      this.roomManager.setPlayerState(room.id, emptyPlayer(user.id));
      this.wsManager.broadcast(room.players, {
        type: WsEvent.UserJoinedGameRoom,
        data: this.roomPayload(room),
      });

      if (room.players.length >= room.gameConfig.maxPlayersCount) {
        this.beginMatch(room, gameType, mode);
      }
      return;
    }

    const room: GameRoom = {
      id: crypto.randomUUID(),
      gameType,
      gameMode: mode,
      gameConfig,
      players: [user.id],
      status: "WAITING",
      questions: [],
    };
    this.roomManager.createRoom(room);
    this.roomManager.setPlayerState(room.id, emptyPlayer(user.id));
    this.wsManager.send(user.id, {
      type: WsEvent.GameCreated,
      data: this.roomPayload(room),
    });
  }

  answer(
    user: User,
    payload: {
      answer: GameAnswer;
      questionId: number;
      gameId: string;
    },
  ) {
    const { answer, questionId, gameId } = payload;
    const room = this.roomManager.getRoom(gameId);

    if (!room) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Game room not found",
      });
      return;
    }

    if (room.endedAt && room.endedAt < Date.now()) {
      this.finishGame(room);
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Game has ended",
      });
      return;
    }

    if (room.status === "FINISHED") {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Game has ended",
      });
      return;
    }

    if (room.status !== "PLAYING") {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Game is not playing",
      });
      return;
    }

    if (!room.players.includes(user.id)) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "User room not found",
      });
      return;
    }

    const roomStates = this.roomManager.getRoomStates(gameId);
    const player = roomStates?.get(user.id);
    if (!player) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "User room not found",
      });
      return;
    }

    const handler = getHandler(room.gameType, room.gameMode);
    if (!handler) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Game type is not available",
      });
      return;
    }

    const result = handler.answer(room, player, answer, questionId);
    if (!result.ok) {
      if (result.error) {
        this.wsManager.send(user.id, {
          type: WsEvent.Error,
          payload: result.error,
        });
      }
      return;
    }

    if (result.broadcastNext) {
      const states = this.roomManager.getRoomStates(room.id);
      if (states && room.currentQuestion) {
        for (const state of states.values()) {
          state.questionIndex = room.currentQuestion.index;
        }
      }
    }

    if (result.scored) {
      this.wsManager.broadcast(room.players, {
        type: WsEvent.UserStats,
        data: this.playerStats(room),
      });
    }

    if (result.finish) {
      this.finishGame(room);
      return;
    }

    if (result.restartPlayerPhase && handler.startPlayerPhase) {
      const ctx = this.phaseContext(room);
      ctx.scheduleFor(
        player.userId,
        () => {
          if (room.status !== "PLAYING") {
            return;
          }
          handler.startPlayerPhase?.(room, player, ctx);
        },
        500,
      );
      return;
    }

    if (handler.startPhases && result.broadcastNext) {
      handler.startPhases(room, this.phaseContext(room));
      return;
    }

    if (result.nextPublic) {
      const message = {
        type: WsEvent.Questions,
        data: { question: result.nextPublic },
      };
      if (result.broadcastNext) {
        this.wsManager.broadcast(room.players, message);
      } else {
        this.wsManager.send(user.id, message);
      }
    }
  }

  leave(user: User) {
    const room = this.roomManager.getRoomByUser(user.id);
    if (!room) {
      return;
    }

    if (room.status === "PLAYING" || room.status === "FINISHED") {
      this.userManager.disconnectUser(user.id);
      return;
    }

    this.roomManager.removePlayer(room.id, user.id);
    room.status = "WAITING";
    if (room.startTimer) {
      clearTimeout(room.startTimer);
      room.startTimer = undefined;
    }

    if (room.players.length === 0) {
      this.roomManager.deleteRoom(room.id);
      return;
    }

    this.wsManager.broadcast(room.players, {
      type: WsEvent.GameClose,
      data: { ...this.roomPayload(room), userId: user.id },
    });
  }

  forfeit(user: User) {
    const room = this.roomManager.getRoomByUser(user.id);
    if (!room) {
      return;
    }

    if (room.status !== "PLAYING") {
      this.leave(user);
      return;
    }

    const winnerId =
      room.players.find((playerId) => playerId !== user.id) ?? null;
    this.finishGame(room, winnerId);
  }

  onDisconnect(user: User) {
    const room = this.roomManager.getRoomByUser(user.id);
    if (!room) {
      return;
    }
    if (room.status === "WAITING" || room.status === "STARTING") {
      this.leave(user);
    }
  }

  reconnect(user: User) {
    const room = this.roomManager.getRoomByUser(user.id);
    if (!room) {
      return;
    }

    if (room.status === "WAITING") {
      this.wsManager.send(user.id, {
        type: WsEvent.GameCreated,
        data: this.roomPayload(room),
      });
      return;
    }

    if (room.status === "STARTING") {
      this.wsManager.send(user.id, {
        type: WsEvent.GameReady,
        data: this.roomPayload(room),
      });
      return;
    }

    if (room.status === "FINISHED") {
      this.wsManager.send(user.id, {
        type: WsEvent.GameReconnected,
        data: {
          ...this.roomPayload(room),
          stats: this.playerStats(room),
        },
      });
      return;
    }

    const player = this.roomManager.getRoomStates(room.id)?.get(user.id);
    const handler = getHandler(room.gameType, room.gameMode);
    const question =
      player && handler ? handler.publicQuestion(room, player) : undefined;

    this.wsManager.send(user.id, {
      type: WsEvent.GameReconnected,
      data: {
        ...this.roomPayload(room),
        stats: this.playerStats(room),
        question,
      },
    });
  }

  finishGame(room: GameRoom, winnerId?: string | null) {
    if (room.status !== "PLAYING") {
      return;
    }

    this.roomManager.clearTimers(room);
    room.status = "FINISHED";
    const stats = this.playerStats(room);
    this.wsManager.broadcast(room.players, {
      type: WsEvent.GameFinished,
      data: {
        roomId: room.id,
        stats,
        ...(winnerId !== undefined ? { winnerId } : {}),
      },
    });

    room.gcTimer = setTimeout(() => {
      this.roomManager.deleteRoom(room.id);
    }, FINISH_GC_MS);
  }

  broadcastOnline() {
    this.wsManager.broadcastAll({
      type: WsEvent.OnlineUsers,
      data: this.userManager.publicUsers(),
    });
  }

  private beginMatch(room: GameRoom, gameType: GameType, gameMode: GameMode) {
    const handler = getHandler(gameType, gameMode);
    if (!handler) {
      return;
    }

    for (const playerId of room.players) {
      if (!this.roomManager.getRoomStates(room.id)?.has(playerId)) {
        this.roomManager.setPlayerState(room.id, emptyPlayer(playerId));
      }
    }

    room.status = "STARTING";
    this.wsManager.broadcast(room.players, {
      type: WsEvent.GameReady,
      data: this.roomPayload(room),
    });

    room.startTimer = setTimeout(() => {
      if (room.status !== "STARTING") {
        return;
      }
      this.startPlaying(room, handler);
    }, START_DELAY_MS);
  }

  private startPlaying(
    room: GameRoom,
    handler: NonNullable<ReturnType<typeof getHandler>>,
  ) {
    room.status = "PLAYING";
    room.startedAt = Date.now();
    room.endedAt = room.startedAt + room.gameConfig.timeLimit * 1000;
    handler.prepare(room);

    this.wsManager.broadcast(room.players, {
      type: WsEvent.GameStarting,
      data: this.roomPayload(room),
    });

    const ctx = this.phaseContext(room);
    if (handler.startPlayerPhase) {
      const states = this.roomManager.getRoomStates(room.id);
      if (states) {
        for (const player of states.values()) {
          handler.startPlayerPhase(room, player, ctx);
        }
      }
    } else if (handler.startPhases) {
      handler.startPhases(room, ctx);
    } else {
      const states = this.roomManager.getRoomStates(room.id);
      if (states) {
        for (const [playerId, player] of states) {
          const question = handler.publicQuestion(room, player);
          if (question) {
            this.wsManager.send(playerId, {
              type: WsEvent.Questions,
              data: { question },
            });
          }
        }
      }
    }

    const remaining = Math.max((room.endedAt ?? Date.now()) - Date.now(), 0);
    room.endTimer = setTimeout(() => {
      this.finishGame(room);
    }, remaining);
  }

  private phaseContext(room: GameRoom): PhaseContext {
    if (!room.playerPhaseTimers) {
      room.playerPhaseTimers = new Map();
    }
    return {
      broadcast: (message) => this.wsManager.broadcast(room.players, message),
      send: (userId, message) => this.wsManager.send(userId, message),
      schedulePhase: (fn, ms) => {
        if (room.phaseTimer) {
          clearTimeout(room.phaseTimer);
        }
        room.phaseTimer = setTimeout(fn, ms);
      },
      clearPhase: () => {
        if (room.phaseTimer) {
          clearTimeout(room.phaseTimer);
          room.phaseTimer = undefined;
        }
      },
      scheduleFor: (userId, fn, ms) => {
        const previous = room.playerPhaseTimers?.get(userId);
        if (previous) {
          clearTimeout(previous);
        }
        room.playerPhaseTimers?.set(userId, setTimeout(fn, ms));
      },
      clearFor: (userId) => {
        const previous = room.playerPhaseTimers?.get(userId);
        if (previous) {
          clearTimeout(previous);
          room.playerPhaseTimers?.delete(userId);
        }
      },
    };
  }

  private playerStats(room: GameRoom): RawStat[] {
    const states = this.roomManager.getRoomStates(room.id);
    return room.players.map((playerId) => {
      const state = states?.get(playerId);
      return {
        userId: playerId,
        score: state?.score ?? 0,
        totalAnsweredQuestions: state?.answerQuestionIds.length ?? 0,
      };
    });
  }

  private roomPayload(room: GameRoom): RoomPayload {
    return {
      id: room.id,
      gameType: room.gameType,
      gameMode: room.gameMode,
      gameConfig: room.gameConfig,
      players: room.players
        .map((id) => this.userManager.getUser(id))
        .filter((user): user is User => Boolean(user))
        .map((user) => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        })),
      status: room.status,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
    };
  }
}
