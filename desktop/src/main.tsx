import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import { useAccountStore } from "./stores/account";
import {
  getCategories,
  getSettings,
  getTransactions,
  listAccountsWithDetails,
  listBudgets,
  listTiles,
} from "./api";
import { useTransactionStore } from "./stores/transaction";
import { TransactionWithId } from "../../cli/bindings/TransactionWithId";
import { useBudgetStore } from "./stores/budget";
import { useTileStore } from "./stores/tiles";
import { useSettingStore } from "./stores/setting";
import { useCategoryStore } from "./stores/category";

Promise.all([
  listAccountsWithDetails().then(async (accounts) => {
    useAccountStore.setState({
      accounts: new Map(
        accounts.map((account) => [account.id.id.String, account])
      ),
    });

    const transactions = new Map<string, TransactionWithId[]>();

    for (const [id, account] of useAccountStore.getState().accounts) {
      await getTransactions(account.id, account.filter).then((t) =>
        transactions.set(id, t)
      );
    }

    useTransactionStore.setState({
      transactions,
    });
  }),
  listBudgets().then((budgets) => useBudgetStore.setState({ budgets })),
  listTiles().then((tiles) => useTileStore.setState({ tiles })),
  getSettings().then((settings) => useSettingStore.setState({ settings })),
  getCategories().then((categories) => {
    const groups = Array.from(categories.values()).filter(
      (category) => !category.parent
    );
    const all = Array.from(categories.values()).map((category) => {
      if (!category.parent) category.parent = category.id;
      return category;
    });

    useCategoryStore.setState({
      categories: new Map(
        all.map((category) => [category.id.id.String, category])
      ),
      categoryGroups: new Map(
        groups.map((category) => [category.id.id.String, category])
      ),
    });
  }),
]).then(() =>
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter basename="/">
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
);
