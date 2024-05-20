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
    pub amount: f64,
    pub description: String,
    pub tags: std::collections::HashSet<String>,
}

/// Type of operations on an account.
#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(tag = "operation")]
pub enum Transaction {
    /// Add currency to an account.
    #[serde(rename = "i")]
    Income(Item),
    // FIXME: expense
    /// Substract currency from an account.
    #[serde(rename = "s")]
    Spending(Item),
}

impl Transaction {
    pub fn date(&self) -> &time::Date {
        match self {
            Self::Income(item) | Self::Spending(item) => &item.date,
        }
    }

    pub fn amount(&self) -> f64 {
        match self {
            Self::Income(item) => item.amount,
            Self::Spending(item) => -item.amount,
        }
    }
}
