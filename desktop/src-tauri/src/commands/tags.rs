use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tauri::State;
use tunes_cli::transaction::Tag;

#[tauri::command]
pub async fn get_tags(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<Tag>, String> {
    let database = database.lock().await;
    let accounts: Vec<Tag> = database.select("tag").await.unwrap();

    Ok(accounts)
}

#[tauri::command]
pub async fn add_tags(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    tags: Vec<Tag>,
) -> Result<(), String> {
    let database = database.lock().await;

    tunes_cli::add_tags(&database, tags).await
}
