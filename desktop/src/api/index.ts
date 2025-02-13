import { invoke } from "@tauri-apps/api/core";
import { AddTransactionOptions } from "../../../cli/bindings/AddTransactionOptions";
import { Tag } from "../../../cli/bindings/Tag";
import { TransactionWithId } from "../../../cli/bindings/TransactionWithId";
import { GetTransactionOptions } from "../../../cli/bindings/GetTransactionOptions";
import { Account } from "../../../cli/bindings/Account";
import { BalanceOptions } from "../../../cli/bindings/BalanceOptions";
import { Settings } from "../../../cli/bindings/Settings";
import { CurrencyBalance } from "../../../cli/bindings/CurrencyBalance";

// TODO: could this be automated ?

// Transactions.
export const getCurrency = (accountName: string): Promise<string> => invoke("get_currency", { accountName });
export const getBalance = (accountName: string, options?: BalanceOptions): Promise<number> => invoke("get_balance", { accountName, options });
export const getAllBalance = (): Promise<CurrencyBalance[]> => invoke("get_all_balance");
export const getTransactions = (accountName: string, options?: GetTransactionOptions): Promise<TransactionWithId[]> => invoke("get_transactions", { accountName, options });
export const addTransaction = (accountName: string, options: AddTransactionOptions): Promise<void> => invoke("add_transaction", { accountName, options });
export const updateTransaction = (transaction: TransactionWithId): Promise<void> => invoke("update_transaction", { transaction });

// Accounts.
export const listAccountNames = (): Promise<string[]> => invoke("list_accounts",);
export const getAccount = (accountName: string): Promise<Account> => invoke("get_account", { accountName });
// TODO: Make this Partial<Account>
export const updateAccount = (account: Account): Promise<void> => invoke("update_account", { account });

// Settings.
export const getSettings = (): Promise<Settings> => invoke("get_settings");
export const saveSettings = (settings: Settings): Promise<void> => invoke("save_settings", { settings });
export const getTags = (): Promise<Tag[]> => invoke("get_tags");
export const addTags = (tags: Tag[]): Promise<void> => invoke("add_tags", { tags });

// Backups.
export const ExportBackup = (): Promise<void> => invoke("backup_export");
export const ImportBackup = (path: string): Promise<void> => invoke("backup_import", { path });
