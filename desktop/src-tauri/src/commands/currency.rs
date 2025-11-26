use surrealdb::Surreal;
use surrealdb::{engine::local::Db, RecordId};
use tauri::State;
use thunes_cli::currency::UpdateCurrencyOptions;
use thunes_cli::{
    currency::{AddCurrencyOptions, CurrencyWithId},
    portfolio::currency::{Currency, ReadCurrencyOptions},
};

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn list_currencies(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<String>, String> {
    let database = database.lock().await;

    thunes_cli::portfolio::currency::list(&database)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to list currencies".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_currency(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: ReadCurrencyOptions,
) -> Result<Currency, String> {
    let database = database.lock().await;

    thunes_cli::portfolio::currency::read(&database, options)
        .await
        .map_err(|error| {
            error.trace();
            "failed to get currency data".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_currency(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: AddCurrencyOptions,
) -> Result<CurrencyWithId, String> {
    let database = database.lock().await;

    thunes_cli::currency::create(&database, options)
        .await
        .map_err(|error| {
            error.trace();
            "failed to create currency".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_currency_2(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    id: RecordId,
) -> Result<CurrencyWithId, String> {
    let database = database.lock().await;

    thunes_cli::currency::read(&database, id)
        .await
        .map_err(|error| {
            error.trace();
            "failed to get currency".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_currency(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: UpdateCurrencyOptions,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::currency::update(&database, options)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update currency".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn delete_currency(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    id: surrealdb::RecordId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::currency::delete(&database, id)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to delete currency".to_string()
        })
}
