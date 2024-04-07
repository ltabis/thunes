#[derive(Debug)]
pub enum Error {
    ParsingFieldNotFound(String),
    ParsingFieldFailed {
        field: String,
        error: Box<dyn std::error::Error>,
    },
    InvalidOperation(String),
    Serialize(serde_json::Error),
    Deserialize(serde_json::Error),
}

/// Information common to all operations types.
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Item {
    pub date: time::Date,
    pub ammount: f64,
    pub description: String,
    pub tags: std::collections::HashSet<String>,
}

/// Type of operations on an account.
#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(tag = "operation", rename_all = "kebab-case")]
pub enum Transaction {
    /// Add currency to an account.
    Income(Item),
    /// Substract currency from an account.
    Spending(Item),
}

impl Transaction {
    pub fn from_json(json: &str) -> Result<Self, Error> {
        serde_json::from_str(json).map_err(Error::Serialize)
    }

    // TODO: impl de/serialize from multiple data types.
    // TODO: use bincode ?
    pub fn write_to_json<H>(&self, writter: H) -> Result<(), Error>
    where
        H: std::io::Write,
    {
        serde_json::to_writer(writter, self).map_err(Error::Serialize)
    }

    pub fn as_str(&self) -> &str {
        match self {
            Self::Income(_) => "i",
            Self::Spending(_) => "s",
        }
    }

    pub fn date(&self) -> time::Date {
        match self {
            Self::Income(item) | Self::Spending(item) => item.date,
        }
    }

    pub fn ammount(&self) -> f64 {
        match self {
            Self::Income(item) => item.ammount,
            Self::Spending(item) => -item.ammount,
        }
    }
}
