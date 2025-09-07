import { create } from "zustand";
import { addAccount, updateAccount } from "../api";
import { Account } from "../../../cli/bindings/Account";
import { AddAccountOptions } from "../../../cli/bindings/AddAccountOptions";

interface AccountState {
  accounts: Map<string, Account>;
  create: (account: AddAccountOptions) => Promise<Account>;
  update: (account: Account) => Promise<void>;
  getCurrencies: () => string[];
  filterByCurrency: (currency: string) => Account[];
}

// TODO: generalize errors with snack bars.

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: new Map(),
  create: async (account: AddAccountOptions): Promise<Account> => {
    const newAccount = await addAccount(account);
    set((state) => ({
      accounts: new Map(state.accounts).set(
        newAccount.id.id.String,
        newAccount
      ),
    }));
    return newAccount;
  },
  update: async (account: Account) => {
    await updateAccount(account);
    set((state) => ({
      accounts: new Map(state.accounts).set(account.id.id.String, account),
    }));
  },
  // FIXME: real dirty.
  getCurrencies: () => {
    const accounts = get().accounts;

    return Array.from(
      new Set(
        Array.from(accounts.values()).map((account) => account.currency)
      ).values()
    );
  },

  filterByCurrency: (currency) => {
    const accounts = get().accounts;

    return Array.from(accounts.values()).filter(
      (account) => account.currency === currency
    );
  },
}));
