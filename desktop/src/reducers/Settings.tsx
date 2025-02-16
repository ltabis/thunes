import { Settings as AppSettings } from "../../../cli/bindings/Settings";
import { saveSettings } from "../api";

export type Action =
  | { type: "update"; settings: AppSettings }
  | { type: "save" };

export function settingsReducer(
  settings: AppSettings,
  action: Action
): AppSettings {
  switch (action.type) {
    case "update": {
      return action.settings;
    }
    case "save": {
      // TODO: generalize info with snack bars.
      saveSettings(settings)
        .then(() => console.info("config saved!"))
        .catch((error) => console.error(error));

      return settings;
    }
  }
}
