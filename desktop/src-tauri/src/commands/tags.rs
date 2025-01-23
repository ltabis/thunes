use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tauri::State;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct TagOption {
    label: String,
    color: Option<String>,
}

#[tauri::command]
pub async fn get_tags(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<TagOption>, String> {
    let database = database.lock().await;
    let accounts: Vec<TagOption> = database.select("tag").await.unwrap();

    Ok(accounts)
}

#[tauri::command]
pub async fn add_tags(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    tags: Vec<TagOption>,
) -> Result<(), String> {
    let database = database.lock().await;
    for tag in tags {
        let _: Option<tunes_cli::Record> = database
            .upsert(("tag", &tag.label))
            .content(tag)
            .await
            .unwrap();
    }

    Ok(())
}

// TODO: remove tag command.
