import { invoke } from "@tauri-apps/api/core";
import { AddTransactionOptions } from "../../../cli/bindings/AddTransactionOptions";
import { Tag } from "../../../cli/bindings/Tag";
import { TransactionWithId } from "../../../cli/bindings/TransactionWithId";
import { GetTransactionOptions } from "../../../cli/bindings/GetTransactionOptions";
import { Account } from "../../../cli/bindings/Account";
import { BalanceOptions } from "../../../cli/bindings/BalanceOptions";
import { Settings } from "../../../cli/bindings/Settings";
import { CurrencyBalance } from "../../../cli/bindings/CurrencyBalance";
import { AddAccountOptions } from "../../../cli/bindings/AddAccountOptions";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";

// TODO: could this be automated ?

// FIXME: To remove or setup in rust and ts_rs.
export type RecordId = { tb: string, id: { String: string } };
export const EMPTY_RECORD_ID: RecordId = { tb: "", id: { String: "" } };

// Transactions.
export const getCurrency = (accountId: RecordId): Promise<string> => invoke("get_currency", { accountId });
export const getBalance = (accountId: RecordId, options?: BalanceOptions): Promise<number> => invoke("get_balance", { accountId, options });
export const getAllBalance = (): Promise<CurrencyBalance[]> => invoke("get_all_balance");
export const getTransactions = (accountId: RecordId, options?: GetTransactionOptions): Promise<TransactionWithId[]> => invoke("get_transactions", { accountId, options });
export const addTransaction = (accountId: RecordId, options: AddTransactionOptions): Promise<void> => invoke("add_transaction", { accountId, options });
export const updateTransaction = (transaction: TransactionWithId): Promise<void> => invoke("update_transaction", { transaction });

// Categories.
// TODO:
export const getCategory = (categoryId: RecordId): Promise<TransactionWithId[]> => invoke("get_category", { categoryId });
export const addCategory = (categoryId: RecordId, options: AddCategoryOptions): Promise<void> => invoke("add_category", { categoryId, options });
export const updateCategory = (transaction: TransactionWithId): Promise<void> => invoke("update_category", { transaction });
export const deleteCategory = (categoryId: RecordId): Promise<void> => invoke("delete_category", { categoryId });

// Accounts.
export const listAccounts = (): Promise<AccountIdentifiers[]> => invoke("list_accounts");
export const getAccount = (accountId: RecordId): Promise<Account> => invoke("get_account", { accountId });
export const addAccount = (options: AddAccountOptions): Promise<void> => invoke("add_account", { options });
export const deleteAccount = (accountId: RecordId): Promise<void> => invoke("delete_account", { accountId });
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
