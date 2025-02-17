use tauri::{App, Manager};
use thunes_cli::{settings::Settings, Record};

pub mod commands {
    pub mod account;
    pub mod settings;
    pub mod tags;
}

fn setup(app: &mut App) -> std::result::Result<(), Box<dyn std::error::Error>> {
    // Setup dev tools.
    #[cfg(debug_assertions)]
    {
        let window = app.get_webview_window("main").unwrap();
        window.open_devtools();
    }

    // a builder for `FmtSubscriber`.
    let subscriber = tracing_subscriber::FmtSubscriber::builder()
        // all spans/events with a level higher than TRACE (e.g, debug, info, warn, etc.)
        // will be written to stdout.
        .with_max_level(tracing::Level::INFO)
        .compact()
        // completes the builder.
        .finish();

    tracing::subscriber::set_global_default(subscriber)?;

    // Setup surreal database.
    let path_resolver = app.path();

    let mut path = path_resolver
        .app_config_dir()
        .expect("unknown app config path");

    path.push("store");

    let mut data_dir = path_resolver.app_data_dir().expect("unknown app data path");

    data_dir.push("backups");

    let db = tauri::async_runtime::block_on(tauri::async_runtime::spawn(async {
        let db: surrealdb::Surreal<surrealdb::engine::local::Db> = surrealdb::Surreal::init();
        db.connect::<surrealdb::engine::local::RocksDb>(path)
            .await
            .unwrap();

        db.use_ns("user").use_db("accounts").await.unwrap();

        // FIXME: move db seeding to an install script.
        let result: Result<Option<Record>, surrealdb::Error> = db
            .insert(("settings", "main"))
            .content(Settings::new(data_dir))
            .await;

        match result {
            Ok(_) | Err(surrealdb::Error::Db(surrealdb::error::Db::RecordExists { .. })) => {}
            _ => {
                tracing::error!("failed to initialize settings");
                return Err("failed to initialize settings");
            }
        }

        Ok(db)
    }))??;

    app.manage(tokio::sync::Mutex::new(db));

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::account::get_account,
            commands::account::update_account,
            commands::account::list_accounts,
            commands::account::add_account,
            commands::account::delete_account,
            commands::account::get_transactions,
            commands::account::get_currency,
            commands::account::get_balance,
            commands::account::get_all_balance,
            commands::account::add_transaction,
            commands::account::update_transaction,
            commands::tags::get_tags,
            commands::tags::add_tags,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::backup_export,
            commands::settings::backup_import,
        ])
        .setup(setup)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
