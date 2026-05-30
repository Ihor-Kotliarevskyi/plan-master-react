import { useEffect, type ReactNode } from "react";
import { readLegacyAppSnapshot } from "../bridge/legacy-app";
import { useReactHostStore } from "../store/app-shell-store";

const BRIDGE_SYNC_INTERVAL_MS = 1500;

export function ReactHostProvider({ children }: { children: ReactNode }) {
  const hydrateFromLegacy = useReactHostStore((state) => state.hydrateFromLegacy);

  useEffect(() => {
    const sync = () => {
      hydrateFromLegacy(readLegacyAppSnapshot());
    };

    sync();
    const intervalId = window.setInterval(sync, BRIDGE_SYNC_INTERVAL_MS);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [hydrateFromLegacy]);

  return <>{children}</>;
}
