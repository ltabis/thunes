import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { SettingsProvider } from "./contexts/Settings";

import { useAccountStore } from "./stores/account";
import {
  getTransactions,
  listAccountsWithDetails,
  listBudgets,
  listTiles,
} from "./api";
import { useTransactionStore } from "./stores/transaction";
import { TransactionWithId } from "../../cli/bindings/TransactionWithId";
import { useBudgetStore } from "./stores/budget";
import { useTileStore } from "./stores/tiles";

await listAccountsWithDetails().then((accounts) =>
  useAccountStore.setState({
    accounts: new Map(
      accounts.map((account) => [account.id.id.String, account])
    ),
  })
);

const transactions = new Map<string, TransactionWithId[]>();

for (const [id, account] of useAccountStore.getState().accounts) {
  await getTransactions(account.id).then((t) => transactions.set(id, t));
}

useTransactionStore.setState({
  transactions,
});

useBudgetStore.setState({ budgets: await listBudgets() });
useTileStore.setState({ tiles: await listTiles() });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
