use surrealdb::{engine::local::Db, RecordId, Surreal};
use transaction::{Tag, Transaction};

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
    Io(std::io::Error),
    Serde(serde_json::Error),
    InvalidDateRange,
    Exists,
    Database(surrealdb::Error),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Error::Io(error) => error.to_string(),
                Error::Serde(error) => error.to_string(),
                Error::InvalidDateRange => "Invalid date range".to_string(),
                Error::Exists => "Account already exists".to_string(),
                Error::Database(error) => error.to_string(),
            }
        )
    }
}

impl From<std::io::Error> for Error {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value)
    }
}

impl From<serde_json::Error> for Error {
    fn from(value: serde_json::Error) -> Self {
        Self::Serde(value)
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

#[derive(Default)]
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
        r#"RETURN math::sum(SELECT * FROM transaction WHERE account = 'account:"{account}"'"#
    );

    if let Some(start) = options.period_start {
        query.push_str(&format!(" AND date > {start}"));
    }

    if let Some(end) = options.period_end {
        query.push_str(&format!(" AND date < {end}"));
    }

    if let Some(tag) = options.tag {
        query.push_str(&format!(" AND tags.find(|$tag| $tag.label = {tag})"));
    }

    query.push_str(")");

    let sum: Option<f64> = db.query(query).await?.take(0).unwrap();

    Ok(sum.unwrap())
}

pub async fn add_income_transaction(
    db: &Surreal<Db>,
    account: &str,
    amount: f64,
    description: String,
    tags: Vec<Tag>,
) -> Result<(), Error> {
    add_transaction(db, account, "i", amount, description, tags).await
}

pub async fn add_transaction(
    db: &Surreal<Db>,
    account: &str,
    operation: &str,
    amount: f64,
    description: String,
    tags: Vec<Tag>,
) -> Result<(), Error> {
    let query = format!(
        r#"
    CREATE transaction SET
        operation = "{operation}",
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

#[derive(Default)]
pub struct TransactionOptions {
    pub start: Option<surrealdb::Datetime>,
    pub end: Option<surrealdb::Datetime>,
}

pub async fn transactions_between(
    db: &Surreal<Db>,
    account: RecordId,
    options: TransactionOptions,
) -> Result<Vec<Transaction>, Error> {
    let account_id = account.key();
    let mut query = format!(
        r#"RETURN math::sum(SELECT * FROM transaction WHERE account = 'account:"{account_id}"'"#
    );

    if let Some(start) = options.start {
        query.push_str(&format!(" AND date > {start}"));
    }

    if let Some(end) = options.end {
        query.push_str(&format!(" AND date < {end}"));
    }

    query.push_str(")");

    let sum: Option<Vec<Transaction>> = db.query(query).await?.take(0).unwrap();

    Ok(sum.unwrap())
}
