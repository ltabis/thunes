import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { SettingsProvider } from "./contexts/Settings";

import { useAccountStore } from "./stores/accounts";
import { getTransactions, listAccountsWithDetails } from "./api";
import { useTransactionStore } from "./stores/transactions";
import { TransactionWithId } from "../../cli/bindings/TransactionWithId";

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
