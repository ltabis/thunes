use surrealdb::{engine::local::Db, Surreal};
use tauri::State;
use thunes_cli::{settings::Settings, Record};

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_settings(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Settings, ()> {
    let database = database.lock().await;

    let settings: Option<Settings> = database.select(("settings", "main")).await.unwrap();

    Ok(settings.unwrap())
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
        .unwrap();

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
        .import(path)
        .await
        .map_err(|error| error.to_string())
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
        .unwrap()
        .unwrap();

    let mut path = settings.backups_path;

    let format =
        time::format_description::parse("[year]-[month]-[day]T[hour]:[minute]:[second].surql")
            .expect("format is not valid");

    path.push(
        time::OffsetDateTime::now_utc()
            .format(&format)
            .expect("failed to format"),
    );

    database
        .export(path)
        .await
        .map_err(|error| error.to_string())
}
