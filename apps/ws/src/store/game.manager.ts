import {
  DEFAULT_GAME_CONFIG_BY_MODE,
  GAME_MODES_BY_TYPE,
  getGameConfig,
  isGameType,
  resolveGameMode,
  WsEvent,
  type CreateCustomRoomSchema,
  type GameAnswer,
  type GameMode,
  type GameType,
  type JoinCustomRoomSchema,
  type RawStat,
  type RoomChallenge,
  type RoomPayload,
} from "@quickmath/common";
import type {
  GameRoom,
  PhaseContext,
  PlayerState,
  RoomStatus,
  User,
} from "../utils/types";
import type { RoomManager } from "./room.manager";
import type { UserManager } from "./user.manager";
import type { WsManager } from "./ws.manager";
import { getHandler } from "./game/handlers";
import { generateJoinCode } from "../utils/lib";

const START_DELAY_MS = 3000;
const FINISH_GC_MS = 1000 * 60;

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

  challengeUser(
    challenger: User,
    payload: { challengedId: string; gameType: GameType; gameMode: GameMode },
  ) {
    const { challengedId, gameType, gameMode } = payload;

    const existingChallenge =
      this.roomManager.getChallengeByChallengedId(challengedId);

    if (
      existingChallenge &&
      existingChallenge.createdAt > new Date(Date.now() - 1000 * 15)
    ) {
      this.wsManager.send(challenger.id, {
        type: WsEvent.Error,
        data: "You have already challenged this user in the last 15 seconds",
      });
      return;
    }

    const challenged = this.userManager.getUser(challengedId);

    const ifUserIsInAnotherRoom = this.roomManager.getRoomByUser(challengedId);
    if (ifUserIsInAnotherRoom) {
      this.wsManager.send(challenger.id, {
        type: WsEvent.Error,
        payload: "User is already in another room",
      });
      return;
    }

    if (!challenged) {
      this.wsManager.send(challenger.id, {
        type: WsEvent.Error,
        payload: "Challenged user not found",
      });
      return;
    }
    const challenge: RoomChallenge = {
      id: crypto.randomUUID(),
      challenger,
      challenged,
      gameType,
      gameMode,
      createdAt: new Date(Date.now()),
    };
    this.roomManager.addChallenge(challenge);
    this.wsManager.send(challenged.id, {
      type: WsEvent.ChallengeReceived,
      data: {
        ...challenge,
      },
    });
    this.wsManager.send(challenger.id, {
      type: WsEvent.ChallengeUser,
      data: {
        ...challenge,
      },
    });
  }

  acceptChallenge(challenged: User, payload: { challengeId: string }) {
    const { challengeId } = payload;
    const challenge = this.roomManager.getChallengeById(challengeId);
    if (!challenge) {
      this.wsManager.send(challenged.id, {
        type: WsEvent.Error,
        payload: "Challenge not found",
      });
      return;
    }

    if (challenge.challenged.id !== challenged.id) {
      this.wsManager.send(challenged.id, {
        type: WsEvent.Error,
        payload: "You are not the challenged user",
      });
      return;
    }

    if (challenge.createdAt < new Date(Date.now() - 1000 * 15)) {
      this.roomManager.removeChallenge(challengeId);
      this.wsManager.send(challenged.id, {
        type: WsEvent.Error,
        payload: "Challenge expired",
      });
      return;
    }

    if (challenge.acceptedAt) {
      this.roomManager.removeChallenge(challengeId);
      this.wsManager.send(challenged.id, {
        type: WsEvent.ChallengeAccepted,
        data: { challengeId },
      });
    }

    const room: GameRoom = {
      id: crypto.randomUUID(),
      hostId: challenge.challenger.id,
      isPrivate: true,
      joinCode: generateJoinCode(),
      gameType: challenge.gameType,
      gameMode: challenge.gameMode,
      gameConfig: getGameConfig(challenge.gameType, challenge.gameMode),
      players: [challenge.challenger.id, challenge.challenged.id],
      status: "WAITING",
      questions: [],
    };

    this.roomManager.createRoom(room);

    this.roomManager.setPlayerState(
      room.id,
      emptyPlayer(challenge.challenger.id),
    );
    this.roomManager.setPlayerState(
      room.id,
      emptyPlayer(challenge.challenged.id),
    );

    this.wsManager.broadcast(room.players, {
      type: WsEvent.CustomRoomCreated,
      data: this.roomPayload(room),
    });
  }

  declineChallenge(challenged: User, payload: { challengeId: string }) {
    const { challengeId } = payload;
    const challenge = this.roomManager.getChallengeById(challengeId);
    if (!challenge) {
      this.wsManager.send(challenged.id, {
        type: WsEvent.Error,
        payload: "Challenge not found",
      });
      return;
    }

    if (challenge.challenged.id !== challenged.id) {
      this.wsManager.send(challenged.id, {
        type: WsEvent.Error,
        payload: "You are not the challenged user",
      });
      return;
    }

    this.wsManager.send(challenge.challenger.id, {
      type: WsEvent.ChallengeDeclined,
      data: { challengeId },
    });
    this.roomManager.removeChallenge(challengeId);
  }

  createCustomRoom(user: User, payload: CreateCustomRoomSchema) {
    const { gameType, gameMode, gameConfig } = payload;
    const room: GameRoom = {
      hostId: user.id,
      isPrivate: true,
      joinCode: generateJoinCode(),
      id: crypto.randomUUID(),
      gameType,
      gameMode,
      gameConfig: {
        difficulty: gameConfig.difficulty,
        maxPlayersCount: gameConfig.maxPlayers,
        questionsCount: 0,
        timeLimit: gameConfig.timeLimit,
      },
      players: [user.id],
      status: "WAITING",
      questions: [],
    };

    this.roomManager.createRoom(room);
    this.roomManager.setPlayerState(room.id, emptyPlayer(user.id));
    this.wsManager.send(user.id, {
      type: WsEvent.CustomRoomCreated,
      data: this.roomPayload(room),
    });
  }

  joinCustomRoom(user: User, payload: JoinCustomRoomSchema) {
    const { joinCode } = payload;
    const room = this.roomManager
      .getRooms()
      .find((room) => room.joinCode === joinCode);

    if (room?.status === "FINISHED") {
      this.roomManager.deleteRoom(room.id);
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Room is finished",
      });
      return;
    }

    if (!room) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Room not found",
      });
      return;
    }
    if (room.gameConfig.maxPlayersCount <= room.players.length) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Room is full",
      });
      return;
    }
    if (room.players.includes(user.id)) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "You are already in this room",
      });
      return;
    }
    room.players.push(user.id);
    this.roomManager.setPlayerState(room.id, emptyPlayer(user.id));
    this.wsManager.broadcast(room.players, {
      type: WsEvent.UserJoinedCustomRoom,
      data: this.roomPayload(room),
    });
    return;
  }

  startCustomRoom(user: User, payload: { roomId: string }) {
    const { roomId } = payload;

    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Room not found",
      });

      return;
    }

    if (room.hostId !== user.id) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "You are not the host of this room",
      });

      return;
    }

    if (room.status !== "WAITING") {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Room is not waiting",
      });

      return;
    }

    if (room.players.length < 2) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Need at least 2 players",
      });

      return;
    }

    this.beginMatch(room, room.gameType, room.gameMode);
  }

  exitCustomRoom(user: User, payload: { roomId: string }) {
    const { roomId } = payload;
    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Room not found",
      });
      return;
    }
    if (!room.players.includes(user.id)) {
      this.wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "You are not in this room",
      });
      return;
    }

    if (room.hostId === user.id) {
      console.log("exited by host");
      this.roomManager.deleteRoom(room.id);
      this.wsManager.broadcast(room.players, {
        type: WsEvent.ExitCustomRoom,
        data: null,
      });
    } else {
      this.roomManager.removePlayer(room.id, user.id);
      this.wsManager.send(user.id, {
        type: WsEvent.ExitCustomRoom,
        data: null,
      });
      this.wsManager.broadcast(room.players, {
        type: WsEvent.ExitCustomRoom,
        data: this.roomPayload(room),
      });
    }
  }

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
          !room.isPrivate &&
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
      hostId: user.id,
      isPrivate: false,
      joinCode: undefined,
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
        console.log("not starting");
        return;
      }
      this.startPlaying(room, handler);
    }, START_DELAY_MS);
  }

  private startPlaying(
    room: GameRoom,
    handler: NonNullable<ReturnType<typeof getHandler>>,
  ) {
    console.log("start playing");
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
      isPrivate: room.isPrivate,
      joinCode: room.joinCode,
      hostId: room.hostId,
      gameConfig: room.gameConfig,
      players: room.players
        .map((id) => this.userManager.getUser(id))
        .filter((user): user is User => Boolean(user))
        .map((user) => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        })),
      status: room.status as RoomStatus,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
    };
  }
}
