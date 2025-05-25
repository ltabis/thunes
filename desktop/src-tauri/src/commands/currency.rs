use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tauri::State;
use thunes_cli::portfolio::currency::{Currency, ReadCurrencyOptions};
use thunes_cli::Error as ThunesError;

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
        .map_err(|error| match error {
            ThunesError::Database(error) => {
                tracing::error!(%error, "database error");
                "failed to get currency data".to_string()
            }
            ThunesError::RecordNotFound => {
                tracing::error!("currency not found");
                "currency data not found".to_string()
            }
        })
}
