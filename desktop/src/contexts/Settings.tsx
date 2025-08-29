import { Settings } from "../../../cli/bindings/Settings";
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from "react";
import { Action, settingsReducer } from "../reducers/Settings";

const SettingsContext = createContext<Settings | null>(null);
const SettingsDispatchContext = createContext<Dispatch<Action> | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, {
    backups_path: "",
    theme: "system",
    tags: [],
  });

  return (
    <SettingsContext.Provider value={settings}>
      <SettingsDispatchContext.Provider value={dispatch}>
        {children}
      </SettingsDispatchContext.Provider>
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
export const useDispatchSettings = () => useContext(SettingsDispatchContext);
