#[derive(Debug)]
pub enum Error {
    Serde(serde_json::Error),
    Io(std::io::Error),
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    #[default]
    System,
    Light,
    Dark,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct Settings {
    pub path: std::path::PathBuf,
    pub accounts_path: std::path::PathBuf,
    #[serde(default)]
    pub theme: Theme,
    #[serde(default)]
    pub tags: Vec<String>,
}

impl Settings {
    pub fn new(
        path: impl Into<std::path::PathBuf>,
        accounts_path: impl Into<std::path::PathBuf>,
    ) -> Result<Self, Error> {
        let path = path.into();

        if path.exists() {
            let raw = std::fs::read_to_string(path).map_err(|error| Error::Io(error))?;

            serde_json::from_str::<Settings>(&raw)
                .map_err(|error: serde_json::Error| Error::Serde(error))
        } else {
            let settings = Self {
                path,
                accounts_path: accounts_path.into(),
                theme: Theme::Dark,
                tags: vec![],
            };

            std::fs::create_dir_all(&settings.path.parent().expect("expected parent"))
                .map_err(|error| Error::Io(error))?;

            std::fs::write(
                &settings.path,
                serde_json::to_vec(&settings)
                    .map_err(|error: serde_json::Error| Error::Serde(error))?,
            )
            .map_err(|error| Error::Io(error))?;

            Ok(settings)
        }
    }

    pub fn save(&self) -> Result<(), Error> {
        std::fs::write(
            &self.path,
            &serde_json::to_string_pretty(self)
                .map_err(|error: serde_json::Error| Error::Serde(error))?,
        )
        .map_err(|error| Error::Io(error))?;

        Ok(())
    }
}
