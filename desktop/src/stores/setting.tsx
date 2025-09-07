import { create } from "zustand";
import { getSettings, saveSettings } from "../api";
import { Settings } from "../../../cli/bindings/Settings";

interface SettingState {
  settings: Settings;
  // TODO: save to database.
  opened: {
    account: string | undefined;
    budget: string | undefined;
  };
  update: (settings: Settings) => Promise<void>;
  open: (id: string, type: "account" | "budget") => void;
}

// TODO: generalize errors with snack bars.

export const useSettingStore = create<SettingState>((set) => ({
  settings: { backups_path: "", tags: [], theme: "dark" },
  opened: {
    account: undefined,
    budget: undefined,
  },
  update: async (settings: Settings) => {
    await saveSettings(settings);
    const updated = await getSettings();

    set({
      settings: updated,
    });
  },
  open: (id: string, type: "account" | "budget") => {
    switch (type) {
      case "account":
        set((state) => ({
          ...state,
          opened: {
            ...state.opened,
            account: id,
          },
        }));
        break;
      case "budget": {
        set((state) => ({
          ...state,
          opened: {
            ...state.opened,
            budget: id,
          },
        }));
        break;
      }
    }
  },
}));
