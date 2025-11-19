use surrealdb::{engine::local::Db, Surreal};

use crate::{Error, Record, TIME_FORMAT};

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

pub async fn read(db: &Surreal<Db>) -> Result<Settings, Error> {
    let settings: Option<Settings> = db.select(("settings", "main")).await?;

    settings.ok_or_else(|| Error::RecordNotFound)
}

pub async fn save(db: &Surreal<Db>, settings: Settings) -> Result<(), Error> {
    let _: Option<Record> = db
        // TODO: settings per user.
        .update(("settings", "main"))
        .merge(settings)
        .await?;

    Ok(())
}

pub async fn import_backup(db: &Surreal<Db>, path: &str) -> Result<(), Error> {
    db.query(
        r#"
REMOVE DATABASE accounts;
REMOVE NAMESPACE user;
"#,
    )
    .await?;

    db.import(path).await.map_err(Error::Database)
}

pub async fn export_backup(db: &Surreal<Db>) -> Result<(), Error> {
    let settings: Settings = db
        .select(("settings", "main"))
        .await?
        .ok_or_else(|| Error::RecordNotFound)?;

    let mut path = settings.backups_path;

    path.push(
        time::OffsetDateTime::now_utc()
            .format(&TIME_FORMAT)
            .map_err(Error::TimeFormat)?,
    );

    db.export(path).await.map_err(Error::Database)
}
