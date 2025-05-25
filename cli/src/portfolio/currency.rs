use surrealdb::{engine::local::Db, Surreal};

use crate::{AccountWithBalance, Error};

#[derive(ts_rs::TS)]
#[ts(export, rename = "CurrencyTileType")]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum Type {
    Pie,
}

#[derive(ts_rs::TS)]
#[ts(export, rename = "CurrencyTile")]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Tile {
    pub t: Type,
    pub currency: String,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct Currency {
    pub currency: String,
    pub total_balance: f64,
    pub accounts: Vec<AccountWithBalance>,
}

pub async fn list(db: &Surreal<Db>) -> Result<Vec<String>, surrealdb::Error> {
    let query = r#"(SELECT currency FROM account GROUP BY currency).map(|$obj| $obj.currency)"#;

    let currency: Vec<String> = db.query(query).await?.take(0)?;

    Ok(currency)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize)]
pub struct ReadCurrencyOptions {
    pub name: String,
}

pub async fn read(db: &Surreal<Db>, options: ReadCurrencyOptions) -> Result<Currency, Error> {
    let query = r#"
        SELECT 
            math::sum(balance) as total_balance,
            array::group([{account: account, balance: balance}]) as accounts,
            account.currency as currency
        FROM ONLY (
            SELECT
                math::sum(amount) as balance,
                account
            FROM transaction
            WHERE account.currency = $currency
            GROUP BY account
            FETCH account
        )
        GROUP BY currency
        LIMIT 1"#;

    let currency: Option<Currency> = db
        .query(query)
        .bind(("currency", options.name))
        .await?
        .take(0)?;

    currency.ok_or(Error::RecordNotFound)
}
