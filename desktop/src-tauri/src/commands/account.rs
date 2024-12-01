use tauri::State;
use tunes_cli::account::{Account, Data};
use tunes_cli::transaction::Transaction;

pub type Accounts = std::collections::HashMap<String, Account>;

// FIXME: refactor with cli library.
pub fn list_accounts_paths(accounts_path: &std::path::PathBuf) -> Vec<std::path::PathBuf> {
    std::fs::read_dir(accounts_path)
        .map(|dir| {
            dir.filter_map(|entry| {
                let account = entry.expect("entry must be valid").path();
                if account.is_file() {
                    Some(account)
                } else {
                    None
                }
            })
            .collect()
        })
        .unwrap_or_default()
}

fn __get_account<'a>(accounts: &'a Accounts, account_name: &str) -> Result<&'a Account, String> {
    accounts
        .get(account_name)
        .ok_or("account not found".to_string())
}

#[tauri::command]
pub fn list_accounts(accounts: State<'_, std::sync::Mutex<Accounts>>) -> Vec<String> {
    accounts
        .lock()
        .unwrap()
        .values()
        .into_iter()
        .map(|account| account.data.name.to_string())
        .collect()
}

// FIXME: maybe needs to be pulled every time from disc in case of external changes to the accounts.
#[tauri::command]
pub fn get_account(
    accounts: State<'_, std::sync::Mutex<Accounts>>,
    account_name: &str,
) -> Result<Data, String> {
    __get_account(&accounts.lock().unwrap(), account_name).map(|account| account.data.clone())
}

#[tauri::command]
pub fn get_currency(
    accounts: State<'_, std::sync::Mutex<Accounts>>,
    account_name: &str,
) -> Result<String, String> {
    __get_account(&accounts.lock().unwrap(), account_name)
        .map(|account| account.currency().to_string())
}

#[tauri::command]
pub fn get_transactions(
    accounts: State<'_, std::sync::Mutex<Accounts>>,
    account_name: &str,
) -> Result<Vec<Transaction>, String> {
    __get_account(&accounts.lock().unwrap(), account_name).map(|account| {
        account
            .transactions_between(None, None)
            .expect("we do not use dates so the time range is always valid")
            .into()
    })
}

#[tauri::command]
pub fn get_balance(accounts: State<'_, std::sync::Mutex<Accounts>>, account_name: &str) -> f64 {
    __get_account(&accounts.lock().unwrap(), account_name)
        .map(|account| {
            account
                .balance()
                .expect("we do not use dates so the time range is always valid")
        })
        .unwrap_or_default()
}

#[tauri::command]
pub fn get_date() -> serde_json::Value {
    serde_json::to_value(&time::OffsetDateTime::now_utc().date()).unwrap()
}

#[tauri::command]
pub fn add_transaction(
    accounts: State<'_, std::sync::Mutex<Accounts>>,
    account: &str,
    transaction: Transaction,
) -> Result<(), String> {
    let mut accounts = accounts.lock().unwrap();

    accounts
        .get_mut(account)
        .ok_or("Account not found".to_string())
        .and_then(|account| {
            account
                .write_transaction(transaction)
                .map_err(|error: tunes_cli::account::Error| error.to_string())
        })
        .map(|_| ())
}
