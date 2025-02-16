#[derive(Debug)]
pub enum Error {
    Serde(serde_json::Error),
    Io(std::io::Error),
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    System,
    Light,
    #[default]
    Dark,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Settings {
    #[serde(default)]
    pub theme: Theme,
    #[serde(default)]
    pub tags: Vec<String>,
    pub backups_path: std::path::PathBuf,
}

impl Settings {
    pub fn new(backups_path: std::path::PathBuf) -> Self {
        Self {
            theme: Theme::default(),
            tags: Vec::default(),
            backups_path,
        }
    }
}
