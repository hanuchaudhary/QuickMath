import WebSocket from "ws";
import { verifyToken } from "../utils/lib";
import type { User } from "../utils/types";
import type { UserManager } from "./user.manager";

export class WsManager {
  constructor(private userManager: UserManager) {}

  authenticate(token: string, socket: WebSocket): User | null {
    try {
      const decoded = verifyToken(token) as {
        id: string;
        username: string;
        avatar: string;
      };

      if (!decoded?.id) {
        socket.close();
        return null;
      }

      return {
        id: decoded.id,
        username: decoded.username,
        avatar: decoded.avatar,
        socket,
        connected: true,
      };
    } catch {
      socket.close();
      return null;
    }
  }

  send(userId: string, message: unknown) {
    const user = this.userManager.getUser(userId);
    if (!user || !user.connected || user.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    user.socket.send(JSON.stringify(message));
  }

  broadcast(toUsers: string[], message: unknown) {
    for (const userId of toUsers) {
      this.send(userId, message);
    }
  }

  broadcastAll(message: unknown) {
    for (const user of this.userManager.getUsers()) {
      this.send(user.id, message);
    }
  }
}
