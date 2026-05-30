import { create } from "zustand";
import type { ReactHostRoute, ReactHostSnapshot } from "../types";

export interface ReactHostStore {
  session: ReactHostSnapshot["session"];
  projectCollection: ReactHostSnapshot["projectCollection"];
  currentProject: ReactHostSnapshot["currentProject"];
  ui: ReactHostSnapshot["ui"] & {
    route: ReactHostRoute;
    bridgeReady: boolean;
  };
  lastCapturedAt: string | null;
  hydrateFromLegacy: (snapshot: ReactHostSnapshot) => void;
  setRoute: (route: ReactHostRoute) => void;
}

const initialSnapshot: ReactHostSnapshot = {
  session: {
    isAuthenticated: false,
    authLabel: "",
    userLabel: "",
    syncLabel: "",
  },
  projectCollection: {
    currentId: null,
    items: [],
  },
  currentProject: null,
  ui: {
    activeTab: null,
  },
  capturedAt: "",
};

export const useReactHostStore = create<ReactHostStore>((set) => ({
  session: initialSnapshot.session,
  projectCollection: initialSnapshot.projectCollection,
  currentProject: initialSnapshot.currentProject,
  ui: {
    ...initialSnapshot.ui,
    route: "overview",
    bridgeReady: false,
  },
  lastCapturedAt: null,
  hydrateFromLegacy: (snapshot) =>
    set((state) => ({
      session: snapshot.session,
      projectCollection: snapshot.projectCollection,
      currentProject: snapshot.currentProject,
      ui: {
        ...state.ui,
        activeTab: snapshot.ui.activeTab,
        bridgeReady: true,
      },
      lastCapturedAt: snapshot.capturedAt,
    })),
  setRoute: (route) =>
    set((state) => ({
      ui: {
        ...state.ui,
        route,
      },
    })),
}));
