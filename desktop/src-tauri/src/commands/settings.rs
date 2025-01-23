use surrealdb::{engine::local::Db, Surreal};
use tauri::State;
use tunes_cli::{settings::Settings, Record};

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
