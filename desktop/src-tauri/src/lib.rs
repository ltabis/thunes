use tauri::{Manager, State};
use tunes_cli::account::{Account, Data};
use tunes_cli::settings::Settings;
use tunes_cli::transaction::Transaction;

type Accounts = std::collections::HashMap<String, Account>;

// FIXME: refactor with cli library.
fn list_accounts_paths(accounts_path: &std::path::PathBuf) -> Vec<std::path::PathBuf> {
    std::fs::read_dir(accounts_path)
        .map(|dir| {
            dir.filter_map(|entry| {
                let account = entry.expect("entry must be valid").path();
                if account.is_file() {
                    Some(account)
                } else {
                    None
                }
            })
            .collect()
        })
        .unwrap_or_default()
}

// FIXME: maybe needs to be pulled every time from disc in case of external changes to the accounts.
#[tauri::command]
fn get_accounts(accounts: State<'_, std::sync::Mutex<Accounts>>) -> Vec<Data> {
    accounts
        .lock()
        .unwrap()
        .values()
        .map(|account| account.data.clone())
        .collect()
}

#[tauri::command]
fn get_balance(accounts: State<'_, std::sync::Mutex<Accounts>>, account: &str) -> f64 {
    accounts
        .lock()
        .unwrap()
        .get(account)
        .map(|account| {
            account
                .balance()
                .expect("we do not use dates so the time range is always valid")
        })
        .unwrap_or_default()
}

#[tauri::command]
fn get_date() -> serde_json::Value {
    serde_json::to_value(&time::OffsetDateTime::now_utc().date()).unwrap()
}

#[tauri::command]
fn add_transaction(
    accounts: State<'_, std::sync::Mutex<Accounts>>,
    account: &str,
    transaction: Transaction,
) -> Result<(), String> {
    let mut accounts = accounts.lock().unwrap();

    accounts
        .get_mut(account)
        .ok_or("Account not found".to_string())
        .and_then(|account| {
            account
                .write_transaction(transaction)
                .map_err(|error: tunes_cli::account::Error| error.to_string())
        })
        .map(|_| ())
}

#[tauri::command]
fn get_settings(settings: State<'_, std::sync::Mutex<Settings>>) -> Settings {
    settings.lock().unwrap().clone()
}

#[tauri::command]
fn save_settings(
    settings_state: State<'_, std::sync::Mutex<Settings>>,
    settings: Settings,
) -> Result<(), String> {
    settings
        .save()
        .map_err(|error| format!("failed to write config: {error:?}"))?;
    *settings_state.lock().unwrap() = settings;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            get_accounts,
            get_balance,
            get_date,
            add_transaction
        ])
        .setup(|app| {
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

            let accounts = list_accounts_paths(&settings.accounts_path)
                .into_iter()
                .filter_map(|path| match Account::open(&path) {
                    Ok(account) => Some((account.data.name.clone(), account)),
                    Err(error) => {
                        // FIXME: better errors, send back data + name of failed files.
                        eprintln!("failed to open {path:?}: {error:?}");
                        None
                    }
                })
                .collect::<Accounts>();

            app.manage(std::sync::Mutex::new(settings));
            app.manage(std::sync::Mutex::new(accounts));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
