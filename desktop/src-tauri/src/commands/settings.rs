use surrealdb::{engine::local::Db, Surreal};
use tauri::State;
use thunes_cli::{settings::Settings, Record};

pub const TIME_FORMAT: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]-[month]-[day]T[hour]:[minute]:[second].surql");

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_settings(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Settings, String> {
    let database = database.lock().await;

    let settings: Option<Settings> =
        database
            .select(("settings", "main"))
            .await
            .map_err(|error| {
                tracing::error!(%error, "database error");
                "failed to get settings".to_string()
            })?;

    settings.ok_or_else(|| {
        tracing::error!("settings record not found");
        "settings not found".to_string()
    })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn save_settings(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    settings: Settings,
) -> Result<(), String> {
    let database = database.lock().await;

    let _: Option<Record> = database
        // TODO: settings per user.
        .update(("settings", "main"))
        .merge(settings)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to save settings".to_string()
        })?;

    Ok(())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn backup_import(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    path: &str,
) -> Result<(), String> {
    let database = database.lock().await;

    database
        .query(
            r#"
REMOVE DATABASE accounts;
REMOVE NAMESPACE user;
"#,
        )
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to cleanup database".to_string()
        })?;

    database.import(path).await.map_err(|error| {
        tracing::error!(%error, "database error");
        "failed to import data".to_string()
    })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn backup_export(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<(), String> {
    let database = database.lock().await;
    let settings: Settings = database
        .select(("settings", "main"))
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to export settings".to_string()
        })?
        .ok_or_else(|| {
            tracing::error!("settings record not found");
            "settings not found for exportation".to_string()
        })?;

    let mut path = settings.backups_path;

    path.push(
        time::OffsetDateTime::now_utc()
            .format(&TIME_FORMAT)
            .map_err(|_| "Server error".to_string())?,
    );

    database.export(path).await.map_err(|error| {
        tracing::error!(%error, "database error");
        "failed to export data".to_string()
    })
}
