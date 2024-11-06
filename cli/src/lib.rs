pub mod account;
pub mod script;
pub mod transaction;

pub const TIME_FORMAT: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]-[month]-[day]");
pub const TIME_FORMAT_MONTH: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[month]");
pub const TIME_FORMAT_YEAR: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]");
pub const TIME_FORMAT_DAY: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[day]");

// TODO: thiserror
#[derive(Debug)]
pub enum Error {
    Account(String, account::Error),
    Operation(transaction::Error),
    InvalidDate(time::error::Parse),
    ScriptEvaluation(Box<rhai::EvalAltResult>),
}

impl From<transaction::Error> for Error {
    fn from(value: transaction::Error) -> Self {
        Self::Operation(value)
    }
}

#[derive(Clone, serde::Deserialize)]
pub struct ScriptAccountBalance {
    pub amount: rhai::FLOAT,
    pub currency: String,
}
