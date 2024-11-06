pub mod balance {
    #[tauri::command]
    fn get(account: &str) -> String {
// TODO: Transform CLI into library first
        tunes_cli::Commands::Balance { account: Some(account.to_string()), from: None, to: None, chart: false, script: None }.run(".")

        todo!()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
