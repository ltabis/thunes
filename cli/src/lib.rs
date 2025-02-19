use account::Account;
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

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct BalanceOptions {
    #[ts(as = "Option<String>", optional)]
    pub period_start: Option<surrealdb::Datetime>,
    #[ts(as = "Option<String>", optional)]
    pub period_end: Option<surrealdb::Datetime>,
    #[ts(optional)]
    pub tag: Option<String>,
}

// FIXME: https://surrealdb.com/docs/sdk/rust/methods/query#security-when-using-the-query-method
pub async fn balance(
    db: &Surreal<Db>,
    account_id: &str,
    options: BalanceOptions,
) -> Result<f64, Error> {
    let mut query = format!(
        r#"RETURN (SELECT math::sum(amount) AS sum FROM transaction WHERE account = {account_id}"#
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

pub async fn get_account(db: &Surreal<Db>, account_id: &str) -> Result<Account, Error> {
    let account: Option<Account> = db
        .query(format!("SELECT * FROM account WHERE id = {account_id}"))
        .await
        .unwrap()
        .take(0)
        .unwrap();

    Ok(account.unwrap())
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Debug, serde::Deserialize, serde::Serialize)]
pub struct AccountIdentifiers {
    pub name: String,
    pub id: String,
}

pub async fn list_account(db: &Surreal<Db>) -> Result<Vec<AccountIdentifiers>, Error> {
    let accounts: Vec<Account> = db.select("account").await?;

    Ok(accounts
        .into_iter()
        .map(|account| AccountIdentifiers {
            name: account.data.name,
            id: account.id.to_string(),
        })
        .collect())
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Debug, serde::Deserialize)]
pub struct AddAccountOptions {
    pub name: String,
    pub currency: String,
}

pub async fn add_account(db: &Surreal<Db>, options: AddAccountOptions) -> Result<Account, Error> {
    let x: Option<account::Account> = db
        .create("account")
        .content(serde_json::json!({
            "name": options.name,
            "currency": options.currency,
            "transaction_grid_sort_model": []
        }))
        .await?;

    Ok(x.unwrap())
}

pub async fn delete_account(db: &Surreal<Db>, account_id: &str) -> Result<(), Error> {
    db.query(format!(
        r#"
    DELETE account WHERE id = {account_id};
    DELETE transaction WHERE account = {account_id};"#
    ))
    .await
    .map(|_| ())
    .map_err(|error| error.into())
}

pub async fn update_account(db: &Surreal<Db>, account: Account) -> Result<(), Error> {
    let _: Option<Record> = db
        .update(("account", account.id.key().clone()))
        .merge(account)
        .await
        .unwrap();

    Ok(())
}

pub async fn get_currency(db: &Surreal<Db>, account_id: &str) -> Result<String, Error> {
    // FIXME: select currency, but get a `{ "currency": "EUR" }` instead of just the currency.
    let account: Option<Account> = db
        .query(format!("SELECT * FROM account WHERE id = {account_id}"))
        .await
        .unwrap()
        .take(0)
        .unwrap();

    Ok(account.unwrap().data.currency)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Debug, serde::Deserialize)]
pub struct AddTransactionOptions {
    pub amount: f64,
    pub description: String,
    pub tags: Vec<Tag>,
    #[ts(as = "Option<String>", optional)]
    pub date: Option<surrealdb::Datetime>,
}

pub async fn add_transaction(
    db: &Surreal<Db>,
    account_id: &str,
    options: AddTransactionOptions,
) -> Result<(), Error> {
    let query = format!(
        r#"
    CREATE transaction SET
        date = {},
        amount = {},
        description = "{}",
        tags = {},
        account = {}"#,
        options
            .date
            .map(|date| date.to_string())
            .unwrap_or_else(|| "time::now()".to_string()),
        options.amount,
        options.description,
        serde_json::json!(options.tags),
        account_id
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

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Debug, serde::Deserialize)]
pub struct GetTransactionOptions {
    #[ts(as = "Option<String>", optional)]
    pub start: Option<surrealdb::Datetime>,
    #[ts(as = "Option<String>", optional)]
    pub end: Option<surrealdb::Datetime>,
    /// Get transactions dated in the last `last_x_days` days before today.
    /// Cannot be combined with `start` and `end` options.
    #[ts(optional)]
    pub last_x_days: Option<usize>,
}

pub async fn get_transactions(
    db: &Surreal<Db>,
    account_id: &str,
    options: GetTransactionOptions,
) -> Result<Vec<TransactionWithId>, Error> {
    let mut query = format!(r#"SELECT * FROM transaction WHERE account = {account_id}"#);

    if let Some(last_x_days) = options.last_x_days {
        query.push_str(&format!(
            " AND date >= time::now() - {last_x_days}d AND date <= time::now()"
        ));
    } else {
        if let Some(start) = options.start {
            query.push_str(&format!(" AND date >= {start}"));
        }

        if let Some(end) = options.end {
            query.push_str(&format!(" AND date <= {end}"));
        }
    }

    query.push_str(" ORDER BY date");

    let transactions: Vec<TransactionWithId> = db.query(query).await.unwrap().take(0).unwrap();

    Ok(transactions)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct AccountWithBalance {
    pub account: Account,
    pub balance: f64,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct CurrencyBalance {
    pub currency: String,
    pub total_balance: f64,
    pub accounts: Vec<AccountWithBalance>,
}

pub async fn balances_by_currency(db: &Surreal<Db>) -> Result<Vec<CurrencyBalance>, Error> {
    let query = r#"
        SELECT 
            math::sum(balance) as total_balance,
            array::group([{account: account, balance: balance}]) as accounts,
            account.currency as currency
        FROM (
            SELECT
                math::sum(amount) as balance,
                account
            FROM transaction
            GROUP BY account
            FETCH account
        ) 
        GROUP BY currency"#;

    db.query(query).await?.take(0).map_err(|error| error.into())
}

pub async fn add_tags(db: &Surreal<Db>, tags: Vec<Tag>) -> Result<(), String> {
    for tag in tags {
        let _: Option<Record> = db.upsert(("tag", &tag.label)).content(tag).await.unwrap();
    }

    Ok(())
}
