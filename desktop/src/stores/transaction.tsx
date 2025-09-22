import { create } from "zustand";
import {
  addTransaction,
  addTransactionTransfer,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "../api";
import { Account } from "../../../cli/bindings/Account";
import { TransactionWithId } from "../../../cli/bindings/TransactionWithId";
import { AddTransactionOptions } from "../../../cli/bindings/AddTransactionOptions";
import { AddTransactionTransferOptions } from "../../../cli/bindings/AddTransactionTransferOptions";
import { ReadTransactionOptions } from "../../../cli/bindings/ReadTransactionOptions";

interface TransactionsState {
  transactions: Map<string, TransactionWithId[]>;
  filter: ReadTransactionOptions;
  create: (account: Account, options: AddTransactionOptions) => Promise<void>;
  createTransfer: (options: AddTransactionTransferOptions) => Promise<void>;
  update: (account: Account, transaction: TransactionWithId) => Promise<void>;
  delete: (account: Account, transaction: TransactionWithId) => Promise<void>;
  setFilter: (
    account: Account,
    filter: ReadTransactionOptions
  ) => Promise<void>;
}

// TODO: generalize errors with snack bars.

export const useTransactionStore = create<TransactionsState>((set, get) => ({
  transactions: new Map(),
  filter: {},
  create: async (
    account: Account,
    options: AddTransactionOptions
  ): Promise<void> => {
    await addTransaction(account.id, options);
    const transactions = await getTransactions(account.id, get().filter);

    set((state) => ({
      transactions: new Map(state.transactions).set(
        account.id.id.String,
        transactions
      ),
    }));
  },
  createTransfer: async (
    options: AddTransactionTransferOptions
  ): Promise<void> => {
    await addTransactionTransfer(options);
    const transactionsFrom = await getTransactions(options.from, get().filter);
    const transactionsTo = await getTransactions(options.to, get().filter);

    set((state) => ({
      transactions: new Map(state.transactions)
        .set(options.from.id.String, transactionsFrom)
        .set(options.to.id.String, transactionsTo),
    }));
  },
  update: async (account: Account, transaction: TransactionWithId) => {
    await updateTransaction(transaction);
    const transactions = await getTransactions(account.id, get().filter);

    set((state) => ({
      transactions: new Map(state.transactions).set(
        account.id.id.String,
        transactions
      ),
    }));
  },
  delete: async (account: Account, transaction: TransactionWithId) => {
    await deleteTransaction(transaction.id);
    const transactions = await getTransactions(account.id, get().filter);

    set((state) => ({
      transactions: new Map(state.transactions).set(
        account.id.id.String,
        transactions
      ),
    }));
  },
  setFilter: async (account: Account, filter: ReadTransactionOptions) => {
    const transactions = await getTransactions(account.id, filter);

    set((state) => ({
      filter,
      transactions: new Map(state.transactions).set(
        account.id.id.String,
        transactions
      ),
    }));
  },
}));
