use surrealdb::{engine::local::Db, RecordId, Surreal};

use crate::Error;

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Data {
    pub name: String,
    pub currency: String,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Account {
    #[serde(flatten)]
    pub data: Data,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: RecordId,
}

impl Account {
    /// Create a new account in database.
    pub async fn new(
        db: &Surreal<Db>,
        name: impl Into<String>,
        currency: impl Into<String>,
    ) -> Result<Option<Self>, Error> {
        db.create("account")
            .content(Data {
                name: name.into(),
                currency: currency.into(),
            })
            .await
            .map_err(core::convert::Into::into)
    }
}
