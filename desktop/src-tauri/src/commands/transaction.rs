use surrealdb::engine::local::Db;
use surrealdb::{RecordId, Surreal};
use tauri::State;
use thunes_cli::transaction::{
    AddTransactionOptions, AddTransactionTransferOptions, CurrencyBalance, ReadTransactionOptions,
    TransactionWithId,
};

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
    options: AddTransactionOptions,
) -> Result<TransactionWithId, String> {
    let database = database.lock().await;

    thunes_cli::transaction::create_transaction(&database, account_id, options)
        .await
        .map_err(|error| {
            error.trace();
            "failed to add transaction".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_transaction_transfer(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: AddTransactionTransferOptions,
) -> Result<TransactionWithId, String> {
    let database = database.lock().await;

    thunes_cli::transaction::create_transaction_transfer(&database, options)
        .await
        .map_err(|error| {
            error.trace();
            "failed to add transaction".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_transactions(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
    filter: Option<ReadTransactionOptions>,
) -> Result<Vec<TransactionWithId>, String> {
    let database = database.lock().await;

    thunes_cli::transaction::read(&database, account_id, filter)
        .await
        .map_err(|error| {
            error.trace();
            "failed to get currency".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    transaction: TransactionWithId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::transaction::update(&database, transaction)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update transaction".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn delete_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    transaction: RecordId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::transaction::delete(&database, transaction)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update transaction".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_all_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<CurrencyBalance>, String> {
    let database = database.lock().await;

    thunes_cli::transaction::balances_by_currency(&database)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to get all balances".to_string()
        })
}
