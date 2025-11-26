use surrealdb::{engine::local::Db, RecordId, Surreal};

use crate::Error;

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Currency {
    pub name: String,
    pub symbol: Option<String>,
    pub decimal_digits: usize,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CurrencyWithId {
    #[serde(flatten)]
    pub data: Currency,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: RecordId,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AddCurrencyOptions {
    pub name: String,
    pub symbol: Option<String>,
    pub decimal_digits: usize,
}

pub async fn create(
    db: &Surreal<Db>,
    options: AddCurrencyOptions,
) -> Result<CurrencyWithId, Error> {
    let currency: Option<CurrencyWithId> = db
        .create("currency")
        .content(options)
        .await
        .map_err::<Error, _>(core::convert::Into::into)?;

    currency.ok_or(Error::RecordNotFound)
}

pub async fn read(db: &Surreal<Db>, id: RecordId) -> Result<CurrencyWithId, Error> {
    db.select(id).await?.ok_or(Error::RecordNotFound)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct UpdateCurrencyOptions {
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: RecordId,
    pub name: Option<String>,
    pub symbol: Option<String>,
    pub decimal_digits: Option<usize>,
}

pub async fn update(
    db: &Surreal<Db>,
    options: UpdateCurrencyOptions,
) -> Result<(), surrealdb::Error> {
    let _: Option<crate::Record> = db.update(options.id.clone()).merge(options).await?;

    Ok(())
}

// FIXME: opens a lot of complexity => what happens for accounts that uses this currency ?
pub async fn delete(db: &Surreal<Db>, id: RecordId) -> Result<(), surrealdb::Error> {
    let _: Option<crate::Record> = db.delete(id).await?;

    Ok(())
}
