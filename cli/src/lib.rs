use surrealdb::{engine::local::Db, RecordId, Surreal};
use transaction::{Tag, TransactionWithId};

pub mod account;
pub mod script;
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
pub enum Error {
    Database(surrealdb::Error),
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
            }
        )
    }
}

impl From<surrealdb::Error> for Error {
    fn from(value: surrealdb::Error) -> Self {
        Self::Database(value)
    }
}

pub async fn init_db(
    path: impl AsRef<std::path::Path>,
) -> surrealdb::Surreal<surrealdb::engine::local::Db> {
    let db: surrealdb::Surreal<surrealdb::engine::local::Db> = surrealdb::Surreal::init();
    db.connect::<surrealdb::engine::local::RocksDb>(path.as_ref())
        .await
        .unwrap();

    db.use_ns("user").use_db("accounts").await.unwrap();

    db
}

#[derive(Default, Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct BalanceOptions {
    pub period_start: Option<surrealdb::Datetime>,
    pub period_end: Option<surrealdb::Datetime>,
    pub tag: Option<String>,
}

pub async fn balance(
    db: &Surreal<Db>,
    account: &str,
    options: BalanceOptions,
) -> Result<f64, Error> {
    let mut query = format!(
        r#"RETURN (SELECT math::sum(amount) AS sum FROM transaction WHERE account = 'account:"{account}"'"#
    );

    if let Some(start) = options.period_start {
        query.push_str(&format!(" AND date > {start}"));
    }

    if let Some(end) = options.period_end {
        query.push_str(&format!(" AND date < {end}"));
    }

    if let Some(tag) = options.tag {
        query.push_str(&format!(" AND tags.find(|$tag| $tag.label = '{tag}')"));
    }

    query.push_str(" GROUP ALL).sum");

    let sum: Option<f64> = db.query(query).await?.take(0).unwrap();

    Ok(sum.unwrap_or(0.0))
}

pub async fn add_transaction(
    db: &Surreal<Db>,
    account: &str,
    amount: f64,
    description: String,
    tags: Vec<Tag>,
) -> Result<(), Error> {
    let query = format!(
        r#"
    CREATE transaction SET
        date = time::now(),
        amount = {amount},
        description = "{description}",
        tags = {},
        account = '{}'
"#,
        serde_json::json!(tags),
        format!(r#"account:"{account}""#)
    );

    db.query(query).await?;

    Ok(())
}

pub async fn update_transaction(
    db: &Surreal<Db>,
    transaction: TransactionWithId,
) -> Result<(), Error> {
    let _: Option<Record> = db
        .update(("transaction", transaction.id.key().clone()))
        .merge(transaction)
        .await
        .unwrap();

    Ok(())
}

#[derive(Default)]
pub struct TransactionOptions {
    pub start: Option<surrealdb::Datetime>,
    pub end: Option<surrealdb::Datetime>,
}

pub async fn get_transactions(
    db: &Surreal<Db>,
    account: &str,
    options: TransactionOptions,
) -> Result<Vec<TransactionWithId>, Error> {
    let mut query = format!(r#"SELECT * FROM transaction WHERE account = 'account:"{account}"'"#);

    if let Some(start) = options.start {
        query.push_str(&format!(" AND date > {start}"));
    }

    if let Some(end) = options.end {
        query.push_str(&format!(" AND date < {end}"));
    }

    let transactions: Vec<TransactionWithId> = db.query(query).await.unwrap().take(0).unwrap();

    Ok(transactions)
}
