import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from "react";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";
import { EMPTY_RECORD_ID } from "../api";

// TODO: replace by budget identifier.
export type Action = { type: "select"; budget: AccountIdentifiers };

const BudgetContext = createContext<AccountIdentifiers | null>(null);
const BudgetDispatchContext = createContext<Dispatch<Action> | null>(null);

export function budgetReducer(
  _budget: AccountIdentifiers,
  action: Action
): AccountIdentifiers {
  switch (action.type) {
    case "select": {
      return action.budget;
    }
  }
}

export function budgetProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(budgetReducer, {
    id: EMPTY_RECORD_ID,
    name: "",
  } as AccountIdentifiers);

  return (
    <BudgetContext.Provider value={settings}>
      <BudgetDispatchContext.Provider value={dispatch}>
        {children}
      </BudgetDispatchContext.Provider>
    </BudgetContext.Provider>
  );
}

export const useBudget = () => useContext(BudgetContext);
export const useDispatchBudget = () => useContext(BudgetDispatchContext);
export const budgetIsSelected = (selected: AccountIdentifiers | null) =>
  selected && selected.id.id.String !== "";
