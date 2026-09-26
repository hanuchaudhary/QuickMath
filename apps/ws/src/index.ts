import { WebSocketServer } from "ws";
import type { GameRoom, User } from "./utils/types";
import { generateScore, verifyToken } from "./utils/lib";
import { getGameConfig, isGameType, resolveGameMode, GameMode } from "@quickmath/common";
import { generateQuiz } from "./utils/math";

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

let onlineUsers = new Map<string, User>();
let gameRooms = new Map<string, GameRoom>();
let playerStates = new Map<
  string,
  Map<
    string,
    {
      userId: string;
      questionIndex: number;
      score: number;
      answerQuestionIds: number[];
    }
  >
>();

function broadcastToRoom(room: GameRoom, message: unknown) {
  for (const playerId of room.players) {
    const player = onlineUsers.get(playerId);

    if (player?.socket.readyState === WebSocket.OPEN) {
      player.socket.send(JSON.stringify(message));
    }
  }
}

function roomData(room: GameRoom) {
  return {
    id: room.id,
    gameType: room.gameType,
    gameMode: room.gameMode,
    gameConfig: room.gameConfig,
    players: room.players
      .map((p) => onlineUsers.get(p))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        username: p!.username,
        avatar: p!.avatar,
      })),
    status: room.status,
  };
}

function handleClose(user: User) {
  const room = Array.from(gameRooms.values()).find((gameRoom) =>
    gameRoom.players.includes(user.id),
  );
  if (!room || room.status === "PLAYING" || room.status === "FINISHED") {
    return;
  }

  room.players = room.players.filter((id) => id !== user.id);
  playerStates.get(room.id)?.delete(user.id);
  room.status = "WAITING";

  if (room.players.length === 0) {
    gameRooms.delete(room.id);
    playerStates.delete(room.id);
    return;
  }

  broadcastToRoom(room, {
    type: "GAME_CLOSE",
    data: {
      ...roomData(room),
      userId: user.id,
    },
  });
}

function finishGame(room: GameRoom) {
  if (room.status !== "PLAYING") {
    return;
  }

  room.status = "FINISHED";

  broadcastToRoom(room, {
    type: "GAME_FINISHED",
    data: {
      roomId: room.id,
      stats: room.players.map((playerId) => {
        const playerState = playerStates.get(room.id)?.get(playerId);
        return {
          userId: playerId,
          score: playerState?.score ?? 0,
          totalAnsweredQuestions: playerState?.answerQuestionIds.length ?? 0,
          // winner decide
        };
      }),
    },
  });
}

wss.on("connection", (ws, req) => {
  const token = req.url?.split("?token=")[1];

  if (!token) {
    ws.close();
    return;
  }

  const decoded = verifyToken(token) as {
    id: string;
    username: string;
    avatar: string;
  };

  if (!decoded) {
    ws.close();
    return;
  }

  const user = {
    id: decoded.id,
    username: decoded.username,
    avatar: decoded.avatar,
    socket: ws,
  };

  onlineUsers.set(user.id, user);
  console.log("User connected: " + user.username);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "ONLINE_USERS",
          data: Array.from(
            onlineUsers.values().map((user) => ({
              id: user.id,
              username: user.username,
              avatar: user.avatar,
            })),
          ),
        }),
      );
    }
  });

  ws.on("message", (data) => {
    const parsedData = JSON.parse(data.toString());
    const { type, payload } = parsedData;
    switch (type) {
      case "PLAY_GAME":
        console.log("PLAY here");
        const gameType = payload.gameType;
        if (!isGameType(gameType)) {
          ws.send(
            JSON.stringify({
              type: "ERROR",
              payload: "Valid game type is required",
            }),
          );
          return;
        }

        const gameMode = resolveGameMode(gameType, payload.gameMode);
        const gameConfig = getGameConfig(gameType, gameMode);

        const availableGameRooms = Array.from(gameRooms.values())
          .filter(
            (room) =>
              room.gameType === gameType &&
              room.gameMode === gameMode &&
              room.status === "WAITING" &&
              room.gameConfig.maxPlayersCount > room.players.length,
          )
          .sort((a, b) => a.players.length - b.players.length);

        if (availableGameRooms.length > 0) {
          const gameRoom = availableGameRooms[0]!;
          gameRoom.players.push(user.id);

          const roomStatus =
            gameRoom.gameConfig.maxPlayersCount === gameRoom.players.length
              ? "STARTING"
              : "WAITING";

          gameRoom.status = roomStatus;

          broadcastToRoom(gameRoom, {
            type: "USER_JOINED_GAME_ROOM",
            data: roomData(gameRoom),
          });

          const roomStates = playerStates.get(gameRoom.id) ?? new Map();
          roomStates.set(user.id, {
            userId: user.id,
            questionIndex: 0,
            score: 0,
            answerQuestionIds: [],
          });
          playerStates.set(gameRoom.id, roomStates);

          if (roomStatus === "STARTING") {
            for (const playerId of gameRoom.players) {
              if (!roomStates.has(playerId)) {
                roomStates.set(playerId, {
                  userId: playerId,
                  questionIndex: 0,
                  score: 0,
                  answerQuestionIds: [],
                });
              }
            }

            broadcastToRoom(gameRoom, {
              type: "GAME_READY",
              data: roomData(gameRoom),
            });

            setTimeout(() => {
              gameRoom.status = "PLAYING";
              broadcastToRoom(gameRoom, {
                type: "GAME_STARTING",
                data: roomData(gameRoom),
              });

              const questions = generateQuiz(
                gameConfig.questionsCount,
                gameConfig.difficulty,
              );

              gameRoom.questions = questions;
              gameRoom.currentQuestion = {
                id: questions[0]!.id,
                index: 0,
                answeredBy: null,
                startedAt: new Date(),
              };
              gameRoom.startedAt = Date.now();
              gameRoom.endedAt =
                gameRoom.startedAt + gameConfig.timeLimit * 1000;

              broadcastToRoom(gameRoom, {
                type: "QUESTIONS",
                data: {
                  question: gameRoom.questions[0]!,
                },
              });

              setTimeout(() => {
                finishGame(gameRoom);
              }, gameConfig.timeLimit * 1000);
            }, 3000);
          }
        } else {
          const gameRoom: GameRoom = {
            id: crypto.randomUUID(),
            gameType,
            gameMode,
            gameConfig,
            players: [user.id],
            status: "WAITING",
            questions: [],
          };

          gameRooms.set(gameRoom.id, gameRoom);
          playerStates.set(
            gameRoom.id,
            new Map([
              [
                user.id,
                {
                  userId: user.id,
                  questionIndex: 0,
                  score: 0,
                  answerQuestionIds: [],
                },
              ],
            ]),
          );

          broadcastToRoom(gameRoom, {
            type: "GAME_CREATED",
            data: roomData(gameRoom),
          });
          console.log("User created game room: " + gameRoom.id);
        }

        break;

      case "ANSWER_QUESTION":
        const { answer, questionId, gameId } = payload;
        const gameRoom = gameRooms.get(gameId);

        if (!gameRoom) {
          ws.send(
            JSON.stringify({ type: "ERROR", payload: "Game room not found" }),
          );
          return;
        }

        if (gameRoom.endedAt! < Date.now() || gameRoom.status === "FINISHED") {
          finishGame(gameRoom);
          ws.send(JSON.stringify({ type: "ERROR", payload: "Game has ended" }));
          return;
        }

        if (gameRoom.status !== "PLAYING") {
          ws.send(
            JSON.stringify({ type: "ERROR", payload: "Game is not playing" }),
          );
          return;
        }

        const roomStates = playerStates.get(gameId);
        if (!roomStates) {
          ws.send(
            JSON.stringify({ type: "ERROR", payload: "Game room not found" }),
          );
          return;
        }

        const userRoom = roomStates.get(user.id)!;
        if (!userRoom) {
          ws.send(
            JSON.stringify({ type: "ERROR", payload: "User room not found" }),
          );
          return;
        }

        const question = gameRoom.questions[questionId];
        if (!question) {
          ws.send(
            JSON.stringify({ type: "ERROR", payload: "Question not found" }),
          );
          return;
        }

        const playerStats = () =>
          gameRoom.players.map((playerId) => {
            const playerState = playerStates.get(gameRoom.id)?.get(playerId);
            return {
              userId: playerId,
              score: playerState?.score ?? 0,
              totalAnsweredQuestions:
                playerState?.answerQuestionIds.length ?? 0,
            };
          });

        if (gameRoom.gameMode !== GameMode.FASTEST_FINGER_FIRST) {
          if (userRoom.questionIndex !== questionId) {
            ws.send(
              JSON.stringify({ type: "ERROR", payload: "Question not found" }),
            );
            return;
          }

          if (answer !== question.answer) {
            return;
          }

          userRoom.score++;
          userRoom.answerQuestionIds.push(questionId);
          userRoom.questionIndex++;
          const nextQuestion = gameRoom.questions[userRoom.questionIndex];
          if (nextQuestion) {
            ws.send(
              JSON.stringify({
                type: "QUESTIONS",
                data: {
                  question: nextQuestion,
                },
              }),
            );
          }

          broadcastToRoom(gameRoom, {
            type: "USER_STATS",
            data: playerStats(),
          });
          return;
        }

        const currentQuestion = gameRoom.currentQuestion;
        if (!currentQuestion || currentQuestion.id !== questionId) {
          ws.send(
            JSON.stringify({
              type: "ERROR",
              payload: "Question not found",
            }),
          );
          return;
        }

        if (currentQuestion.answeredBy !== null) {
          ws.send(
            JSON.stringify({
              type: "ERROR",
              payload: "Question already answered",
            }),
          );
          return;
        }

        if (answer !== question.answer) {
          return;
        }

        currentQuestion.answeredBy = user.id;
        const timeTaken = Math.max(
          Date.now() - currentQuestion.startedAt.getTime(),
          1,
        );
        userRoom.score += generateScore(timeTaken);
        userRoom.answerQuestionIds.push(currentQuestion.id);

        const nextIndex = currentQuestion.index + 1;
        for (const playerState of roomStates.values()) {
          playerState.questionIndex = nextIndex;
        }

        const nextQuestion = gameRoom.questions[nextIndex];
        if (nextQuestion) {
          gameRoom.currentQuestion = {
            id: nextQuestion.id,
            index: nextIndex,
            answeredBy: null,
            startedAt: new Date(),
          };

          broadcastToRoom(gameRoom, {
            type: "QUESTIONS",
            data: {
              question: nextQuestion,
            },
          });
        } else {
          finishGame(gameRoom);
        }

        broadcastToRoom(gameRoom, {
          type: "USER_STATS",
          data: playerStats(),
        });

        break;
      case "LEAVE_GAME":
        handleClose(user);
        break;
    }
  });

  ws.on("close", () => {
    handleClose(user);
    onlineUsers.delete(user.id);
  });
});

console.log("WebSocket server running on port: " + PORT);
