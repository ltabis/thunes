import { createContext, Dispatch, ReactNode, useContext, useReducer } from "react";
import { Data as AccountData } from "../../../cli/bindings/Data";
import { Transaction } from "../../../cli/bindings/Transaction";

export type Action = { type: "add", transaction: Transaction } | { type: "select", account: AccountData };

const AccountContext = createContext<AccountData | null>(null);
const AccountDispatchContext = createContext<Dispatch<Action> | null>(null);

export function accountReducer(account: AccountData, action: Action): AccountData {
    switch (action.type) {
        case "add": {
            return {
                ...account,
                transactions: [...account.transactions, action.transaction]
            };
        }

        case "select": {
            return action.account;
        }
    }
}

export function AccountProvider({ children }: { children: ReactNode }) {
    const [settings, dispatch] = useReducer(accountReducer, { name: "", transactions: [], currency: "", });

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