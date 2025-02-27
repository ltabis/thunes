import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from "react";
import { BudgetIdentifiers } from "../../../cli/bindings/BudgetIdentifiers";
import { EMPTY_RECORD_ID } from "../api";

export type Action = { type: "select"; budget: BudgetIdentifiers };

const BudgetContext = createContext<BudgetIdentifiers | null>(null);
const BudgetDispatchContext = createContext<Dispatch<Action> | null>(null);

export function budgetReducer(
  _budget: BudgetIdentifiers,
  action: Action
): BudgetIdentifiers {
  switch (action.type) {
    case "select": {
      return action.budget;
    }
  }
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(budgetReducer, {
    id: EMPTY_RECORD_ID,
    name: "",
  } as BudgetIdentifiers);

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
export const budgetIsSelected = (selected: BudgetIdentifiers | null) =>
  selected && selected.id.id.String !== "";
