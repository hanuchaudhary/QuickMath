import type { GameRoom, PlayerState } from "../utils/types";

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private roomStates: Map<string, Map<string, PlayerState>> = new Map();
  private userRooms: Map<string, string> = new Map();

  createRoom(room: GameRoom) {
    this.rooms.set(room.id, room);
    if (!this.roomStates.has(room.id)) {
      this.roomStates.set(room.id, new Map());
    }
    for (const playerId of room.players) {
      this.userRooms.set(playerId, room.id);
    }
  }

  getRoom(id: string) {
    return this.rooms.get(id);
  }

  getRoomByUser(userId: string) {
    const roomId = this.userRooms.get(userId);
    if (!roomId) {
      return undefined;
    }
    return this.rooms.get(roomId);
  }

  deleteRoom(id: string) {
    const room = this.rooms.get(id);
    if (room) {
      for (const playerId of room.players) {
        if (this.userRooms.get(playerId) === id) {
          this.userRooms.delete(playerId);
        }
      }
      this.clearTimers(room);
    }
    this.rooms.delete(id);
    this.roomStates.delete(id);
  }

  updateRoom(id: string, patch: Partial<GameRoom>) {
    const room = this.rooms.get(id);
    if (!room) {
      return;
    }
    Object.assign(room, patch);
  }

  getRooms() {
    return Array.from(this.rooms.values());
  }

  getRoomStates(id: string) {
    return this.roomStates.get(id);
  }

  setPlayerState(roomId: string, player: PlayerState) {
    let states = this.roomStates.get(roomId);
    if (!states) {
      states = new Map();
      this.roomStates.set(roomId, states);
    }
    states.set(player.userId, player);
    this.userRooms.set(player.userId, roomId);
  }

  removePlayer(roomId: string, userId: string) {
    this.roomStates.get(roomId)?.delete(userId);
    if (this.userRooms.get(userId) === roomId) {
      this.userRooms.delete(userId);
    }
    const room = this.rooms.get(roomId);
    if (room) {
      room.players = room.players.filter((id) => id !== userId);
    }
  }

  clearTimers(room: GameRoom) {
    if (room.startTimer) {
      clearTimeout(room.startTimer);
      room.startTimer = undefined;
    }
    if (room.endTimer) {
      clearTimeout(room.endTimer);
      room.endTimer = undefined;
    }
    if (room.phaseTimer) {
      clearTimeout(room.phaseTimer);
      room.phaseTimer = undefined;
    }
    if (room.gcTimer) {
      clearTimeout(room.gcTimer);
      room.gcTimer = undefined;
    }
  }
}
