use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tauri::State;
use thunes_cli::portfolio::tile::{Tile, WriteOptions};

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_tile(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: WriteOptions,
) -> Result<Tile, String> {
    let database = database.lock().await;

    thunes_cli::portfolio::tile::write(&database, options)
        .await
        .map_err(|error| {
            error.trace();
            "failed to save tile".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_tile(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    id: surrealdb::RecordId,
) -> Result<Tile, String> {
    let database = database.lock().await;

    thunes_cli::portfolio::tile::read(&database, id)
        .await
        .map_err(|error| {
            error.trace();
            "failed to get tile".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn list_tiles(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<Tile>, String> {
    let database = database.lock().await;

    thunes_cli::portfolio::tile::list(&database)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to list tiles".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_tile(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    tile: Tile,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::portfolio::tile::update(&database, tile)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update tile".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn remove_tile(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    id: surrealdb::RecordId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::portfolio::tile::delete(&database, id)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to delete tile".to_string()
        })
}
