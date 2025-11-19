use surrealdb::engine::local::Db;
use surrealdb::{RecordId, Surreal};
use tauri::State;
use thunes_cli::account::BalanceOptions;
use thunes_cli::account::{Account, AccountIdentifiers};

pub type Accounts = std::collections::HashMap<String, Account>;

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn list_accounts(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<AccountIdentifiers>, String> {
    let database = database.lock().await;

    thunes_cli::account::list_accounts(&database)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to list accounts".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn list_accounts_with_details(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<Account>, String> {
    let database = database.lock().await;

    thunes_cli::account::list_accounts_with_details(&database)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to list accounts".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: thunes_cli::account::AddAccountOptions,
) -> Result<Account, String> {
    let database = database.lock().await;

    thunes_cli::account::create(&database, options)
        .await
        .map_err(|error| {
            error.trace();
            "failed to add account".into()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
) -> Result<Account, String> {
    let database = database.lock().await;

    thunes_cli::account::read(&database, account_id)
        .await
        .map_err(|error| {
            error.trace();
            "failed to get account".into()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: Account,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::account::update(&database, account)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update account".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn delete_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::account::delete(&database, account_id)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to delete account".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
    options: Option<BalanceOptions>,
) -> Result<f64, String> {
    let database = database.lock().await;

    thunes_cli::account::balance(&database, account_id, options.unwrap_or_default())
        .await
        .map_err(|error| {
            error.trace();
            "failed to get balance".into()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_currency_from_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
) -> Result<String, String> {
    let database = database.lock().await;

    thunes_cli::account::get_currency(&database, account_id)
        .await
        .map_err(|error| {
            error.trace();
            "failed to get currency".into()
        })
}
