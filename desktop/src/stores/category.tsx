import { create } from "zustand";
import { CategoryWithId } from "../../../cli/bindings/CategoryWithId";

interface CategoryState {
  categories: Map<string, CategoryWithId>;
  categoryGroups: Map<string, CategoryWithId>;
}

export const useCategoryStore = create<CategoryState>(() => ({
  categories: new Map(),
  categoryGroups: new Map(),
}));
