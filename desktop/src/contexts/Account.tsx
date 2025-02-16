import { createContext, Dispatch, ReactNode, useContext, useReducer } from "react";

export type Action = { type: "select", account: string };

const AccountContext = createContext<string | null>(null);
const AccountDispatchContext = createContext<Dispatch<Action> | null>(null);

export function accountReducer(_account: string, action: Action): string {
    switch (action.type) {
        case "select": {
            return action.account;
        }
    }
}

export function AccountProvider({ children }: { children: ReactNode }) {
    const [settings, dispatch] = useReducer(accountReducer, "");

    return (
        <AccountContext.Provider value={settings}>
            <AccountDispatchContext.Provider value={dispatch}>
                {children}
            </AccountDispatchContext.Provider>
        </AccountContext.Provider>
    )
}

export const useAccount = () => useContext(AccountContext);
export const useDispatchAccount = () => useContext(AccountDispatchContext);