use surrealdb::{engine::local::Db, RecordId, Surreal};

use crate::{account::Account, transaction::tag::Tag, Error};

pub mod category;
pub mod tag;

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Transaction {
    #[ts(as = "String")]
    pub date: chrono::DateTime<chrono::Utc>,
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
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub account: RecordId,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub category: RecordId,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Debug, serde::Deserialize)]
pub struct AddTransactionOptions {
    pub amount: f64,
    #[ts(type = "{ tb: string, id: { String: string }}", optional)]
    pub category: Option<surrealdb::RecordId>,
    pub description: String,
    pub tags: Vec<Tag>,
    #[ts(as = "Option<String>", optional)]
    pub date: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn create_transaction(
    db: &Surreal<Db>,
    account_id: RecordId,
    options: AddTransactionOptions,
) -> Result<TransactionWithId, Error> {
    let query = r#"
    CREATE transaction SET
        date = <datetime>$date,
        category = $category,
        amount = $amount,
        description = $description,
        tags = $tags,
        account = $account_id"#;

    let transaction: Option<TransactionWithId> = db
        .query(query)
        .bind(("date", options.date.unwrap_or_else(chrono::Utc::now)))
        .bind((
            "category",
            options.category.unwrap_or(("category", "other").into()),
        ))
        .bind(("amount", options.amount))
        .bind(("description", options.description))
        .bind(("tags", serde_json::json!(options.tags)))
        .bind(("account_id", account_id))
        .await?
        .take(0)?;

    transaction.ok_or(Error::RecordNotFound)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize)]
pub struct AddTransactionTransferOptions {
    pub description: String,
    pub amount: f64,
    #[ts(as = "Option<String>", optional)]
    pub date: Option<chrono::DateTime<chrono::Utc>>,
    pub tags: Vec<Tag>,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub from: RecordId,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub to: RecordId,
}

pub async fn create_transaction_transfer(
    db: &Surreal<Db>,
    options: AddTransactionTransferOptions,
) -> Result<TransactionWithId, Error> {
    let query = r#"
    CREATE transaction SET
        description = $description,
        amount = -$amount,
        date = <datetime>$date,
        tags = $tags,
        account = $from,
        category = $category;
    CREATE transaction SET
        description = $description,
        amount = $amount,
        date = <datetime>$date,
        tags = $tags,
        account = $to,
        category = $category;"#;

    let transaction: Option<TransactionWithId> = db
        .query(query)
        .bind(("description", options.description))
        .bind(("amount", options.amount))
        .bind(("date", options.date.unwrap_or_else(chrono::Utc::now)))
        .bind(("tags", serde_json::json!(options.tags)))
        .bind(("from", options.from))
        .bind(("to", options.to))
        .bind((
            "category",
            RecordId::from(("category", "internal-movements")),
        ))
        .await?
        .take(0)?;

    transaction.ok_or(Error::RecordNotFound)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Default, Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ReadTransactionOptions {
    #[ts(as = "Option<String>", optional)]
    pub search: Option<String>,
    // FIXME: Cannot store a record id here because of serde. Using the id string directly.
    //        See https://github.com/surrealdb/surrealdb/issues/4844
    #[ts(as = "Option<String>", optional)]
    pub category: Option<String>,
    #[ts(as = "Option<String>", optional)]
    pub start: Option<surrealdb::Datetime>,
    #[ts(as = "Option<String>", optional)]
    pub end: Option<surrealdb::Datetime>,
    /// Get transactions dated in the last `last_x_days` days before today.
    /// Cannot be combined with `start` and `end` options.
    #[ts(optional)]
    pub last_x_days: Option<usize>,
}

pub async fn read(
    db: &Surreal<Db>,
    account_id: RecordId,
    filter: Option<ReadTransactionOptions>,
) -> Result<Vec<TransactionWithId>, Error> {
    let filter = match filter {
        Some(filter) => filter,
        None => {
            let filter: Option<ReadTransactionOptions> = db
                .query(r#"SELECT filter FROM type::thing("account", $account_id)"#)
                .bind(("account_id", account_id.clone()))
                .await?
                .take(0)?;
            filter.ok_or(Error::RecordNotFound)?
        }
    };

    let mut query = "SELECT * FROM transaction WHERE account = $account_id".to_string();

    if filter.search.is_some() {
        query.push_str(" AND string::lowercase($search) IN string::lowercase(description)");
    }

    if filter.category.is_some() {
        query.push_str(" AND category = type::thing('category', $category)");
    }

    if filter.last_x_days.is_some() {
        query.push_str(" AND date >= time::now() - $last_x_days AND date <= time::now()");
    } else {
        if filter.start.is_some() {
            query.push_str(" AND date >= $start");
        }

        if filter.end.is_some() {
            query.push_str(" AND date <= $end");
        }
    }

    query.push_str(" ORDER BY date DESC");

    let transactions: Vec<TransactionWithId> = db
        .query(query)
        .bind((
            "last_x_days",
            filter
                .last_x_days
                .map(|n| format!("{n}d"))
                .unwrap_or_default(),
        ))
        .bind(("search", filter.search.unwrap_or_default()))
        .bind(("category", filter.category.unwrap_or("other".into())))
        .bind(("start", filter.start.unwrap_or_default()))
        .bind(("end", filter.end.unwrap_or_default()))
        .bind(("account_id", account_id))
        .await?
        .take(0)?;

    Ok(transactions)
}

pub async fn update(
    db: &Surreal<Db>,
    transaction: TransactionWithId,
) -> Result<(), surrealdb::Error> {
    let query = r#"
    UPDATE $transaction SET
        date = <datetime>$date,
        category = $category,
        amount = $amount,
        description = $description,
        tags = $tags"#;

    db.query(query)
        .bind(("transaction", transaction.id))
        .bind(("date", transaction.inner.date))
        .bind(("category", transaction.category))
        .bind(("amount", transaction.inner.amount))
        .bind(("description", transaction.inner.description))
        .bind(("tags", serde_json::json!(transaction.inner.tags)))
        .await?;

    Ok(())
}

pub async fn delete(db: &Surreal<Db>, transaction: RecordId) -> Result<(), surrealdb::Error> {
    let _: Option<TransactionWithId> = db.delete(transaction).await?;

    Ok(())
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct AccountWithBalance {
    pub account: Account,
    pub balance: f64,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct CurrencyBalance {
    pub currency: String,
    pub total_balance: f64,
    pub accounts: Vec<AccountWithBalance>,
}

// TODO: remove the following
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
