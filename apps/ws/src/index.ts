import { WebSocketServer } from "ws";
import { WsEvent } from "@quickmath/common";
import { RoomManager } from "./store/room.manager";
import { UserManager } from "./store/user.manager";
import { GameManager } from "./store/game.manager";
import { WsManager } from "./store/ws.manager";

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

const userManager = new UserManager();
const roomManager = new RoomManager();
const wsManager = new WsManager(userManager);
const gameManager = new GameManager(roomManager, userManager, wsManager);

wss.on("connection", (ws, req) => {
  const token = req.url?.split("?token=")[1];
  if (!token) {
    ws.close();
    return;
  }

  const authed = wsManager.authenticate(decodeURIComponent(token), ws);
  if (!authed) {
    return;
  }

  const user = userManager.attachSocket(authed);
  gameManager.reconnect(user);
  gameManager.broadcastOnline();

  ws.on("message", (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      const { type, payload } = parsedData;
      switch (type) {
        case WsEvent.PlayGame:
          gameManager.play(user, payload?.gameType, payload?.gameMode);
          break;
        case WsEvent.AnswerQuestion:
          gameManager.answer(user, payload);
          break;
        case WsEvent.LeaveGame:
          gameManager.leave(user);
          break;
        case WsEvent.ForfeitGame:
          gameManager.forfeit(user);
          break;
        case WsEvent.CreateCustomRoom:
          gameManager.createCustomRoom(user, payload);
          break;
        case WsEvent.JoinCustomRoom:
          gameManager.joinCustomRoom(user, payload);
          break;
        case WsEvent.StartCustomRoom:
          gameManager.startCustomRoom(user, payload);
          break;
        case WsEvent.StopCustomRoom:
          gameManager.stopCustomRoom(user, payload);
          break;
        case WsEvent.ChallengeUser:
          gameManager.challengeUser(user, payload);
          break;
        case WsEvent.AcceptChallenge:
          gameManager.acceptChallenge(user, payload);
          break;
        case WsEvent.DeclineChallenge:
          gameManager.declineChallenge(user, payload);
          break;
      }
    } catch {
      wsManager.send(user.id, {
        type: WsEvent.Error,
        payload: "Invalid message",
      });
    }
  });

  ws.on("close", () => {
    const current = userManager.getUser(user.id);
    if (current?.socket !== ws) {
      return;
    }
    userManager.disconnectUser(user.id, ws);
    gameManager.onDisconnect(user);
    gameManager.broadcastOnline();
  });
});

console.log("WebSocket server running on port: " + PORT);
