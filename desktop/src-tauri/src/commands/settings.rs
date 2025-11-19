use surrealdb::{engine::local::Db, Surreal};
use tauri::State;
use thunes_cli::settings::Settings;

pub const TIME_FORMAT: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]-[month]-[day]T[hour]:[minute]:[second].surql");

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_settings(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Settings, String> {
    let database = database.lock().await;

    thunes_cli::settings::read(&database)
        .await
        .map_err(|error| {
            error.trace();
            "failed to get settings data".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn save_settings(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    settings: Settings,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::settings::save(&database, settings)
        .await
        .map_err(|error| {
            error.trace();
            "failed to save settings data".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn import_backup(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    path: &str,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::settings::import_backup(&database, path)
        .await
        .map_err(|error| {
            error.trace();
            "failed to import backups".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn export_backup(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::settings::export_backup(&database)
        .await
        .map_err(|error| {
            error.trace();
            "failed to export backups".to_string()
        })
}
