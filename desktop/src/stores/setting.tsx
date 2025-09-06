import { create } from "zustand";
import { getSettings, saveSettings } from "../api";
import { Settings } from "../../../cli/bindings/Settings";

interface SettingState {
  settings: Settings;
  update: (settings: Settings) => Promise<void>;
}

// TODO: generalize errors with snack bars.

export const useSettingStore = create<SettingState>((set) => ({
  settings: { backups_path: "", tags: [], theme: "dark" },

  update: async (settings: Settings) => {
    await saveSettings(settings);
    const updated = await getSettings();

    set({
      settings: updated,
    });
  },
}));
