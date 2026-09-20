import { useEffect } from "react";
import { getToken } from "../lib/http";
import { useGameStore } from "../stores/game.store";

export function useGameSocket(enabled: boolean) {
  const connect = useGameStore((s) => s.connect);
  const disconnect = useGameStore((s) => s.disconnect);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }
    const token = getToken();
    if (!token) return;
    connect(token);
  }, [enabled, connect, disconnect]);
}
