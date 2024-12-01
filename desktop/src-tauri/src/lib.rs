use tauri::Manager;
use tunes_cli::account::Account;
use tunes_cli::settings::Settings;

pub mod commands {
    pub mod account;
    pub mod settings;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::account::get_account,
            commands::account::list_accounts,
            commands::account::get_transactions,
            commands::account::get_currency,
            commands::account::get_balance,
            commands::account::get_balance_by_tag,
            commands::account::get_date,
            commands::account::add_transaction,
            commands::settings::get_settings,
            commands::settings::save_settings,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            let path_resolver = app.path();
            let config_path = {
                let mut path = path_resolver
                    .app_config_dir()
                    .expect("unknown app config path");
                path.push("tunes.json");
                path
            };
            let accounts_path = {
                let mut path = path_resolver.app_data_dir().expect("unknown app data path");
                path.push(".accounts");
                path
            };

            let settings =
                Settings::new(config_path, accounts_path).expect("failed to configure app");

            let accounts = commands::account::list_accounts_paths(&settings.accounts_path)
                .into_iter()
                .filter_map(|path| match Account::open(&path) {
                    Ok(account) => Some((account.data.name.clone(), account)),
                    Err(error) => {
                        // FIXME: better errors, send back data + name of failed files.
                        eprintln!("failed to open {path:?}: {error:?}");
                        None
                    }
                })
                .collect::<commands::account::Accounts>();

            app.manage(std::sync::Mutex::new(settings));
            app.manage(std::sync::Mutex::new(accounts));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
