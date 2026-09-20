import { WebSocketServer } from "ws";
import type { GameRoom, User } from "./utils/types";
import { verifyToken } from "./utils/lib";
import { DEFAULT_GAME_CONFIG_BY_TYPE, isGameType } from "@matix/common";
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

function finishGame(room: GameRoom) {
  if (room.status !== "PLAYING") {
    return;
  }

  room.status = "FINISHED";

  broadcastToRoom(room, {
    type: "GAME_FINISHED",
    data: {
      roomId: room.id,
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

        const gameConfig = DEFAULT_GAME_CONFIG_BY_TYPE[gameType];

        const availableGameRooms = Array.from(gameRooms.values())
          .filter(
            (room) =>
              room.gameType === gameType &&
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
            data: {
              id: gameRoom.id,
              gameType: gameRoom.gameType,
              gameConfig: gameRoom.gameConfig,
              players: gameRoom.players
                .map((p) => onlineUsers.get(p))
                .filter(Boolean)
                .map((p) => ({
                  id: p!.id,
                  username: p!.username,
                  avatar: p!.avatar,
                })),
              status: roomStatus,
            },
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

            setTimeout(() => {
              gameRoom.status = "PLAYING";
              broadcastToRoom(gameRoom, {
                type: "GAME_STARTING",
                data: {
                  id: gameRoom.id,
                  gameType: gameRoom.gameType,
                  gameConfig: gameRoom.gameConfig,
                  players: gameRoom.players
                    .map((p) => onlineUsers.get(p))
                    .filter(Boolean)
                    .map((p) => ({
                      id: p!.id,
                      username: p!.username,
                      avatar: p!.avatar,
                    })),
                  status: gameRoom.status,
                },
              });

              const questions = generateQuiz(
                gameConfig.questionsCount,
                gameConfig.difficulty,
              );

              gameRoom.questions = questions;
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
            data: {
              id: gameRoom.id,
              gameType: gameRoom.gameType,
              gameConfig: gameRoom.gameConfig,
              players: gameRoom.players
                .map((p) => onlineUsers.get(p))
                .filter(Boolean)
                .map((p) => ({
                  id: p!.id,
                  username: p!.username,
                  avatar: p!.avatar,
                })),
              status: gameRoom.status,
            },
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

        if (userRoom.questionIndex !== questionId) {
          ws.send(
            JSON.stringify({ type: "ERROR", payload: "Question not found" }),
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

        if (answer === question.answer) {
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
        }

        break;
      case "LEAVE_GAME":
        break;
    }
  });
});

console.log("WebSocket server running on port: " + PORT);
