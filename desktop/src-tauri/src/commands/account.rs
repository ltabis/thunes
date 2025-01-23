use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tauri::State;
use tunes_cli::account::Account;
use tunes_cli::transaction::{Tag, TransactionWithId};
use tunes_cli::{BalanceOptions, TransactionOptions};

pub type Accounts = std::collections::HashMap<String, Account>;

// TODO: Make errors understandable by users.

#[tauri::command]
pub async fn list_accounts(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<String>, ()> {
    // FIXME: unwraps.
    let database = database.lock().await;
    let accounts: Vec<Account> = database.select("account").await.unwrap();

    Ok(accounts
        .into_iter()
        .map(|account| account.data.name)
        .collect())
}

#[tauri::command]
pub async fn get_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
    options: Option<BalanceOptions>,
) -> Result<f64, ()> {
    let database = database.lock().await;
    tunes_cli::balance(
        &database,
        account,
        options.unwrap_or(BalanceOptions::default()),
    )
    .await
    .map_err(|_| ())
}

#[tauri::command]
pub async fn get_currency(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
) -> Result<String, String> {
    let database = database.lock().await;
    let account: Account = database
        .select(("account", format!(r#""{account}""#)))
        .await
        .unwrap()
        .unwrap();

    Ok(account.data.currency)
}

#[tauri::command]
pub async fn get_transactions(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
) -> Result<Vec<TransactionWithId>, String> {
    let database = database.lock().await;

    tunes_cli::get_transactions(&database, account, TransactionOptions::default())
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn add_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
    amount: f64,
    description: String,
    tags: Vec<Tag>,
) -> Result<(), String> {
    let database = database.lock().await;

    tunes_cli::add_transaction(&database, account, amount, description, tags)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn update_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    transaction: TransactionWithId,
) -> Result<(), String> {
    let database = database.lock().await;

    tunes_cli::update_transaction(&database, transaction)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_date() -> serde_json::Value {
    serde_json::to_value(&time::OffsetDateTime::now_utc().date()).unwrap()
}
