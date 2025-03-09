use surrealdb::{engine::local::Db, Surreal};
use tauri::State;
use thunes_cli::category::CategoryWithId;

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_categories(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<CategoryWithId>, String> {
    let database = database.lock().await;

    thunes_cli::get_categories(&database)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to get category".to_string()
        })
}
