use surrealdb::RecordId;
use tauri::{App, Manager};
use tunes_cli::settings::Settings;
// use tunes_cli::account::Account;
// use tunes_cli::settings::Settings;

pub mod commands {
    pub mod account;
    pub mod settings;
    pub mod tags;
}

#[derive(Debug, serde::Deserialize)]
struct Record {
    #[allow(dead_code)]
    id: RecordId,
}

fn setup(app: &mut App) -> std::result::Result<(), Box<dyn std::error::Error>> {
    // Setup dev tools.
    #[cfg(debug_assertions)]
    {
        let window = app.get_webview_window("main").unwrap();
        window.open_devtools();
    }

    // Setup surreal database.
    let path_resolver = app.path();

    let mut path = path_resolver
        .app_config_dir()
        .expect("unknown app config path");

    path.push("store");

    let db = tauri::async_runtime::block_on(tauri::async_runtime::spawn(async {
        let db: surrealdb::Surreal<surrealdb::engine::local::Db> = surrealdb::Surreal::init();
        db.connect::<surrealdb::engine::local::RocksDb>(path)
            .await
            .unwrap();

        db.use_ns("user").use_db("accounts").await.unwrap();

        db
    }))?;

    app.manage(tokio::sync::Mutex::new(db));

    // Setup user settings and dev tools.
    let config_path = {
        let mut path = path_resolver
            .app_config_dir()
            .expect("unknown app config path");
        path.push("tunes.json");
        path
    };

    let settings = Settings::new(config_path, "").expect("failed to configure app");

    app.manage(std::sync::Mutex::new(settings));

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // commands::account::get_account,
            commands::account::list_accounts,
            commands::account::get_transactions,
            commands::account::get_currency,
            commands::account::get_balance,
            commands::account::get_balance_by_tag,
            commands::account::get_date,
            commands::account::add_transaction,
            commands::account::update_transaction,
            commands::tags::get_tags,
            commands::tags::add_tags,
            commands::settings::get_settings,
            commands::settings::save_settings,
        ])
        .setup(setup)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
