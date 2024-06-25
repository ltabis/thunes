use rhai::{CustomType, TypeBuilder};

use crate::script::time_helper;

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

    pub fn description(&self) -> &str {
        match self {
            Self::Income(item) | Self::Spending(item) => &item.description,
        }
    }

    pub fn tags(&self) -> &std::collections::HashSet<String> {
        match self {
            Self::Income(item) | Self::Spending(item) => &item.tags,
        }
    }
}

#[derive(Clone, Debug, serde::Deserialize, rhai::CustomType)]
pub struct TransactionRhai {
    /// Get the date of the transaction.
    // #[rhai_type(readonly)]
    pub date: time_helper::Date,
    /// Currency amount of the transaction, can be negative or positive depending of the transaction type.
    #[rhai_type(readonly)]
    pub amount: rhai::FLOAT,
    /// Description of the transaction.
    #[rhai_type(readonly)]
    pub description: String,
    /// Tags associated with the transaction.
    #[rhai_type(readonly)]
    pub tags: rhai::Array,
}

impl From<&Transaction> for TransactionRhai {
    fn from(value: &Transaction) -> Self {
        Self {
            date: value.date().clone(),
            amount: value.amount(),
            description: value.description().to_string(),
            tags: value
                .tags()
                .iter()
                .cloned()
                .map(rhai::Dynamic::from)
                .collect::<rhai::Array>(),
        }
    }
}
