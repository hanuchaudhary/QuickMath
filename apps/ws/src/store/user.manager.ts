import type { User } from "../utils/types";

export class UserManager {
  private users: Map<string, User> = new Map();

  addUser(user: User) {
    this.users.set(user.id, user);
  }

  getUser(id: string) {
    return this.users.get(id);
  }

  getUsers() {
    return Array.from(this.users.values());
  }

  publicUsers() {
    return this.getUsers()
      .filter((user) => user.connected)
      .map((user) => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      }));
  }

  attachSocket(user: User) {
    const existing = this.users.get(user.id);
    if (existing) {
      const previous = existing.socket;
      existing.socket = user.socket;
      existing.connected = true;
      existing.username = user.username;
      existing.avatar = user.avatar;
      if (previous !== user.socket && previous.readyState === 1) {
        previous.close();
      }
      return existing;
    }
    this.users.set(user.id, user);
    return user;
  }

  disconnectUser(userId: string, socket?: User["socket"]) {
    const user = this.getUser(userId);
    if (!user) {
      return;
    }
    if (socket && user.socket !== socket) {
      return;
    }
    user.connected = false;
  }
}
