use rhai::{CustomType, TypeBuilder};
use surrealdb::RecordId;

use crate::script::time_helper;

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Tag {
    pub label: String,
    pub color: Option<String>,
}

impl PartialEq for Tag {
    fn eq(&self, other: &Self) -> bool {
        self.label == other.label
    }
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Transaction {
    pub date: String,
    pub amount: f64,
    pub description: String,
    pub tags: Vec<Tag>,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct TransactionWithId {
    #[serde(flatten)]
    pub inner: Transaction,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: RecordId,
}

impl Transaction {
    pub fn date_time(&self) -> time::Date {
        time::Date::parse(
            &self.date,
            &time::format_description::well_known::Iso8601::DEFAULT,
        )
        .expect("failed to parse date")
    }
}

#[derive(Clone, Debug, serde::Deserialize, rhai::CustomType)]
pub struct TransactionRhai {
    /// Get the date of the transaction.
    #[rhai_type(readonly)]
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
            date: time::Date::parse(
                &value.date,
                &time::format_description::well_known::Iso8601::DEFAULT,
            )
            .expect("failed to parse date"),
            amount: value.amount,
            description: value.description.to_string(),
            tags: value
                .tags
                .iter()
                .cloned()
                .map(rhai::Dynamic::from)
                .collect::<rhai::Array>(),
        }
    }
}
