use tauri::State;
use tunes_cli::settings::Settings;

#[tauri::command]
pub fn get_settings(settings: State<'_, std::sync::Mutex<Settings>>) -> Settings {
    settings.lock().unwrap().clone()
}

#[tauri::command]
pub fn save_settings(
    settings_state: State<'_, std::sync::Mutex<Settings>>,
    settings: Settings,
) -> Result<(), String> {
    settings
        .save()
        .map_err(|error| format!("failed to write config: {error:?}"))?;
    *settings_state.lock().unwrap() = settings;

    Ok(())
}
