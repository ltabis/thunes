use account::Account;
use surrealdb::{engine::local::Db, RecordId, Surreal};
use transaction::{Tag, TransactionWithId};

pub mod account;
pub mod budget;
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
    RecordNotFound,
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
                Error::RecordNotFound => "Record not found".to_string(),
            }
        )
    }
}

impl From<surrealdb::Error> for Error {
    fn from(value: surrealdb::Error) -> Self {
        Self::Database(value)
    }
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

pub async fn balance(
    db: &Surreal<Db>,
    account_id: RecordId,
    options: BalanceOptions,
) -> Result<f64, Error> {
    let mut query =
        r#"RETURN (SELECT math::sum(amount) AS sum FROM transaction WHERE account = $account_id"#
            .to_string();

    if options.period_start.is_some() {
        query.push_str(" AND date > $start");
    }

    if options.period_end.is_some() {
        query.push_str(" AND date < $end");
    }

    if options.tag.is_some() {
        query.push_str(" AND tags.find(|$tag| $tag.label = '$tag_label')");
    }

    query.push_str(" GROUP ALL).sum");

    let sum: Option<f64> = db
        .query(query)
        .bind(("account_id", account_id))
        .bind(("start", options.period_start.unwrap_or_default()))
        .bind(("end", options.period_end.unwrap_or_default()))
        .bind(("tag_label", options.tag.unwrap_or_default()))
        .await?
        .take(0)?;

    // Note: could probably expect here, because the query does not change
    //       the return value of the SELECT statement.
    sum.ok_or(Error::RecordNotFound)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct AccountIdentifiers {
    pub name: String,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: RecordId,
}

pub async fn list_account(db: &Surreal<Db>) -> Result<Vec<AccountIdentifiers>, surrealdb::Error> {
    let accounts: Vec<Account> = db.select("account").await?;

    Ok(accounts
        .into_iter()
        .map(|account| AccountIdentifiers {
            name: account.data.name,
            id: account.id,
        })
        .collect())
}

pub async fn get_currency(db: &Surreal<Db>, account_id: RecordId) -> Result<String, Error> {
    // FIXME: select currency, but get a `{ "currency": "EUR" }` instead of just the currency. (check ONLY statement)
    let account: Option<Account> = db
        .query("SELECT * FROM account WHERE id = $account_id")
        .bind(("account_id", account_id))
        .await?
        .take(0)?;

    account
        .ok_or(Error::RecordNotFound)
        .map(|account| account.data.currency)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Debug, serde::Deserialize)]
pub struct AddTransactionOptions {
    pub amount: f64,
    pub description: String,
    pub tags: Vec<Tag>,
    #[ts(as = "Option<String>", optional)]
    pub date: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn add_transaction(
    db: &Surreal<Db>,
    account_id: RecordId,
    options: AddTransactionOptions,
) -> Result<(), surrealdb::Error> {
    let query = r#"
    CREATE transaction SET
        date = $date,
        amount = $amount,
        description = $description,
        tags = $tags,
        account = $account_id"#;

    db.query(query)
        .bind(("date", options.date.unwrap_or_else(chrono::Utc::now)))
        .bind(("amount", options.amount))
        .bind(("description", options.description))
        .bind(("tags", serde_json::json!(options.tags)))
        .bind(("account_id", account_id))
        .await?;

    Ok(())
}

pub async fn update_transaction(
    db: &Surreal<Db>,
    transaction: TransactionWithId,
) -> Result<(), surrealdb::Error> {
    let _: Option<Record> = db
        .update(("transaction", transaction.id.key().clone()))
        .merge(transaction)
        .await?;

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
    account_id: RecordId,
    options: GetTransactionOptions,
) -> Result<Vec<TransactionWithId>, surrealdb::Error> {
    let mut query = "SELECT * FROM transaction WHERE account = $account_id".to_string();

    if options.last_x_days.is_some() {
        query.push_str(" AND date >= time::now() - $last_x_days AND date <= time::now()");
    } else {
        if options.start.is_some() {
            query.push_str(" AND date >= $start");
        }

        if options.end.is_some() {
            query.push_str(" AND date <= $end");
        }
    }

    query.push_str(" ORDER BY date");

    let transactions: Vec<TransactionWithId> = db
        .query(query)
        .bind((
            "last_x_days",
            options
                .last_x_days
                .map(|n| format!("{n}d"))
                .unwrap_or_default(),
        ))
        .bind(("start", options.start.unwrap_or_default()))
        .bind(("end", options.end.unwrap_or_default()))
        .bind(("account_id", account_id))
        .await?
        .take(0)?;

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

pub async fn balances_by_currency(
    db: &Surreal<Db>,
) -> Result<Vec<CurrencyBalance>, surrealdb::Error> {
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

    let currencies: Vec<CurrencyBalance> = db.query(query).await?.take(0)?;

    Ok(currencies)
}

pub async fn get_tags(db: &Surreal<Db>) -> Result<Vec<Tag>, surrealdb::Error> {
    db.select("tag").await
}

pub async fn add_tags(db: &Surreal<Db>, tags: Vec<Tag>) -> Result<(), surrealdb::Error> {
    for tag in tags {
        let _: Option<Record> = db.upsert(("tag", &tag.label)).content(tag).await?;
    }

    Ok(())
}
