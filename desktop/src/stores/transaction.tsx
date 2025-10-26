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

interface TransactionsState {
  transactions: Map<string, TransactionWithId[]>;
  create: (account: Account, options: AddTransactionOptions) => Promise<void>;
  createTransfer: (options: AddTransactionTransferOptions) => Promise<void>;
  update: (account: Account, transaction: TransactionWithId) => Promise<void>;
  delete: (account: Account, transaction: TransactionWithId) => Promise<void>;
  sync: (account: Account) => Promise<void>;
}

// TODO: generalize errors with snack bars.

export const useTransactionStore = create<TransactionsState>((set) => ({
  transactions: new Map(),
  create: async (
    account: Account,
    options: AddTransactionOptions
  ): Promise<void> => {
    await addTransaction(account.id, options);
    const transactions = await getTransactions(account.id, account.filter);

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
    const transactionsFrom = await getTransactions(options.from);
    const transactionsTo = await getTransactions(options.to);

    set((state) => ({
      transactions: new Map(state.transactions)
        .set(options.from.id.String, transactionsFrom)
        .set(options.to.id.String, transactionsTo),
    }));
  },
  update: async (account: Account, transaction: TransactionWithId) => {
    await updateTransaction(transaction);
    const transactions = await getTransactions(account.id, account.filter);

    set((state) => ({
      transactions: new Map(state.transactions).set(
        account.id.id.String,
        transactions
      ),
    }));
  },
  delete: async (account: Account, transaction: TransactionWithId) => {
    await deleteTransaction(transaction.id);
    const transactions = await getTransactions(account.id, account.filter);

    set((state) => ({
      transactions: new Map(state.transactions).set(
        account.id.id.String,
        transactions
      ),
    }));
  },
  sync: async (account: Account) => {
    const transactions = await getTransactions(account.id, account.filter);

    set((state) => ({
      transactions: new Map(state.transactions).set(
        account.id.id.String,
        transactions
      ),
    }));
  },
}));
