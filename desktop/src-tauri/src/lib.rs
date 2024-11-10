use tunes_cli::account::{Account, Data};

#[tauri::command]
fn get_account(path: &str) -> Result<Data, String> {
    Account::open(path)
        .map_err(|error| format!("{error:?}"))
        .map(|account| account.data)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_account])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
