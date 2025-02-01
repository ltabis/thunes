use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tauri::State;
use tunes_cli::account::Account;
use tunes_cli::transaction::{Tag, TransactionWithId};
use tunes_cli::{BalanceOptions, CurrencyBalance, TransactionOptions};

pub type Accounts = std::collections::HashMap<String, Account>;

// TODO: Make errors understandable by users.

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
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
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
    options: Option<BalanceOptions>,
) -> Result<f64, ()> {
    let database = database.lock().await;
    tunes_cli::balance(&database, account, options.unwrap_or_default())
        .await
        .map_err(|_| ())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_all_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<CurrencyBalance>, String> {
    let database = database.lock().await;
    tunes_cli::balances_by_currency(&database)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
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
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
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
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
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
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    transaction: TransactionWithId,
) -> Result<(), String> {
    let database = database.lock().await;

    tunes_cli::update_transaction(&database, transaction)
        .await
        .map_err(|error| error.to_string())
}
