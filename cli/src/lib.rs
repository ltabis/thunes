use chrono::offset::LocalResult;
use surrealdb::RecordId;

pub mod account;
pub mod budget;
pub mod currency;
pub mod migrations;
pub mod portfolio;
pub mod settings;
pub mod transaction;

pub const TIME_FORMAT: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]-[month]-[day]");
pub const TIME_FORMAT_MONTH: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[month]");
pub const TIME_FORMAT_YEAR: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]");
pub const TIME_FORMAT_DAY: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[day]");

#[derive(Debug)]
pub enum ChronoLocalResultError {
    Ambiguous,
    None,
}

impl<T> From<LocalResult<T>> for ChronoLocalResultError {
    fn from(value: LocalResult<T>) -> Self {
        match value {
            LocalResult::Single(_) => panic!("not an error"),
            LocalResult::Ambiguous(_, _) => Self::Ambiguous,
            LocalResult::None => Self::None,
        }
    }
}

impl std::fmt::Display for ChronoLocalResultError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                ChronoLocalResultError::Ambiguous => "ambiguous",
                ChronoLocalResultError::None => "none",
            }
        )
    }
}

#[derive(Debug)]
pub enum Error {
    Database(surrealdb::Error),
    RecordNotFound,
    Time(ChronoLocalResultError),
    TimeFormat(time::error::Format),
}

impl Error {
    pub fn trace(&self) {
        match self {
            Self::Database(error) => {
                tracing::error!(%error, "database error");
            }
            Self::RecordNotFound => {
                tracing::error!("Record not found");
            }
            Self::Time(error) => {
                tracing::error!(%error, "Time error");
            }
            Error::TimeFormat(error) => tracing::error!(%error, "Time format error"),
        }
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct Record {
    #[allow(dead_code)]
    id: RecordId,
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Error::Database(error) => error.to_string(),
                Error::RecordNotFound => "Record not found".to_string(),
                Error::Time(error) => error.to_string(),
                Error::TimeFormat(error) => error.to_string(),
            }
        )
    }
}

impl From<surrealdb::Error> for Error {
    fn from(value: surrealdb::Error) -> Self {
        Self::Database(value)
    }
}
