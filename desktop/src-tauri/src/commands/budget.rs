use surrealdb::engine::local::Db;
use surrealdb::{RecordId, Surreal};
use tauri::State;
use thunes_cli::budget::Budget;
use thunes_cli::Error as ThunesError;

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_budget(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: thunes_cli::budget::CreateSplitBudgetOptions,
) -> Result<Budget, String> {
    let database = database.lock().await;

    thunes_cli::budget::create_split(&database, options)
        .await
        .map_err(|error| match error {
            ThunesError::Database(error) => {
                tracing::error!(%error, "database error");
                "failed to add budget".to_string()
            }
            // Note: should not happen. See the function internals.
            ThunesError::RecordNotFound => {
                tracing::error!("budget not found after creation");
                "failed to create budget".to_string()
            }
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_budget(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget_id: RecordId,
) -> Result<Budget, String> {
    let database = database.lock().await;

    thunes_cli::budget::read(&database, budget_id)
        .await
        .map_err(|error| match error {
            ThunesError::Database(error) => {
                tracing::error!(%error, "database error");
                "failed to get budget".to_string()
            }
            ThunesError::RecordNotFound => {
                tracing::error!("budget not found");
                "failed to get budget, not found".to_string()
            }
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_budget(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget: Budget,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::budget::update(&database, budget)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update budget".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn delete_budget(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget_id: RecordId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::budget::delete(&database, budget_id)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to delete budget".to_string()
        })
}
