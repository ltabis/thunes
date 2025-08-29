import { create } from "zustand";
import { Budget } from "../../../cli/bindings/Budget";
import { CreateSplitBudgetOptions } from "../../../cli/bindings/CreateSplitBudgetOptions";
import { addBudget, deleteBudget, listBudgets, updateBudget } from "../api";

interface BudgetState {
  budgets: Budget[];
  create: (options: CreateSplitBudgetOptions) => Promise<Budget>;
  getById: (id: string) => Budget | undefined;
  update: (budget: Budget) => Promise<void>;
  delete: (budget: Budget) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  create: async (options) => {
    const budget = await addBudget(options);

    set({
      budgets: await listBudgets(),
    });

    return budget;
  },
  // FIXME: Wrapping the result into a map could be better, and should probably be done from the backend.
  getById: (id) => get().budgets.find((budget) => budget.id.id.String === id),
  update: async (budget) => {
    await updateBudget(budget);

    set({
      budgets: await listBudgets(),
    });
  },
  delete: async (budget) => {
    await deleteBudget(budget.id);

    set({
      budgets: await listBudgets(),
    });
  },
}));
