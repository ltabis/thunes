import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from "react";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";

export type Action = { type: "select"; account: AccountIdentifiers };

const AccountContext = createContext<AccountIdentifiers | null>(null);
const AccountDispatchContext = createContext<Dispatch<Action> | null>(null);

export function accountReducer(
  _account: AccountIdentifiers,
  action: Action
): AccountIdentifiers {
  switch (action.type) {
    case "select": {
      return action.account;
    }
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(accountReducer, {
    id: "",
    name: "",
  } as AccountIdentifiers);

  return (
    <AccountContext.Provider value={settings}>
      <AccountDispatchContext.Provider value={dispatch}>
        {children}
      </AccountDispatchContext.Provider>
    </AccountContext.Provider>
  );
}

export const useAccount = () => useContext(AccountContext);
export const useDispatchAccount = () => useContext(AccountDispatchContext);
export const accountIsSelected = (selected: AccountIdentifiers | null) =>
  selected && selected.id !== "";
