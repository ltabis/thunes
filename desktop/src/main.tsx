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

Promise.all([
  listAccountsWithDetails().then(async (accounts) => {
    useAccountStore.setState({
      accounts: new Map(
        accounts.map((account) => [account.id.id.String, account])
      ),
    });

    const transactions = new Map<string, TransactionWithId[]>();

    for (const [id, account] of useAccountStore.getState().accounts) {
      await getTransactions(account.id).then((t) => transactions.set(id, t));
    }

    useTransactionStore.setState({
      transactions,
    });
  }),
  listBudgets().then((budgets) => useBudgetStore.setState({ budgets })),
  listTiles().then((tiles) => useTileStore.setState({ tiles })),
  getSettings().then((settings) => useSettingStore.setState({ settings })),
]).then(() =>
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter basename="/">
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
);
