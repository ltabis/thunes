use surrealdb::engine::local::Db;
use surrealdb::{RecordId, Surreal};
use tauri::State;
use thunes_cli::account::Account;
use thunes_cli::transaction::TransactionWithId;
use thunes_cli::{
    AccountIdentifiers, AddTransactionOptions, BalanceOptions, CurrencyBalance,
    Error as ThunesError, GetTransactionOptions,
};

pub type Accounts = std::collections::HashMap<String, Account>;

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
) -> Result<Account, String> {
    let database = database.lock().await;

    thunes_cli::account::read(&database, account_id)
        .await
        .map_err(|error| match error {
            ThunesError::Database(error) => {
                tracing::error!(%error, "database error");
                "failed to get account".to_string()
            }
            ThunesError::RecordNotFound => {
                tracing::error!("account not found");
                "failed to get account, not found".to_string()
            }
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
pub async fn list_accounts(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<AccountIdentifiers>, String> {
    let database = database.lock().await;

    thunes_cli::list_account(&database).await.map_err(|error| {
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
        .map_err(|error| match error {
            ThunesError::Database(error) => {
                tracing::error!(%error, "database error");
                "failed to add account".to_string()
            }
            // Note: should not happen. See the function internals.
            ThunesError::RecordNotFound => {
                tracing::error!("account not found after creation");
                "failed to create account".to_string()
            }
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

    thunes_cli::balance(&database, account_id, options.unwrap_or_default())
        .await
        .map_err(|error| match error {
            ThunesError::Database(error) => {
                tracing::error!(%error, "database error");
                "failed to get balance".to_string()
            }
            // Note: should not happen. See the function internals.
            ThunesError::RecordNotFound => {
                tracing::error!("balance not found after computation");
                "failed to get balance".to_string()
            }
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_all_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<CurrencyBalance>, String> {
    let database = database.lock().await;

    thunes_cli::balances_by_currency(&database)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to get all balances".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_currency(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
) -> Result<String, String> {
    let database = database.lock().await;

    thunes_cli::get_currency(&database, account_id)
        .await
        .map_err(|error| match error {
            ThunesError::Database(error) => {
                tracing::error!(%error, "database error");
                "failed to get currency".to_string()
            }
            ThunesError::RecordNotFound => {
                tracing::error!("account not found");
                "account not found".to_string()
            }
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_transactions(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
    options: Option<GetTransactionOptions>,
) -> Result<Vec<TransactionWithId>, String> {
    let database = database.lock().await;

    thunes_cli::get_transactions(&database, account_id, options.unwrap_or_default())
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to get currency".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_id: RecordId,
    options: AddTransactionOptions,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::add_transaction(&database, account_id, options)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to add transaction".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    transaction: TransactionWithId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::update_transaction(&database, transaction)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update transaction".to_string()
        })
}
