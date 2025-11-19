use crate::{transaction::ReadTransactionOptions, Error};
use surrealdb::{engine::local::Db, RecordId, Surreal};

#[derive(ts_rs::TS, Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Data {
    pub name: String,
    pub currency: String,
    pub filter: ReadTransactionOptions,
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

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct AccountIdentifiers {
    pub name: String,
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
                filter: ReadTransactionOptions::default(),
            })
            .await
            .map_err(core::convert::Into::into)
    }
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize)]
pub struct AddAccountOptions {
    pub name: String,
    pub currency: String,
}

pub async fn create(db: &Surreal<Db>, options: AddAccountOptions) -> Result<Account, Error> {
    let account: Option<Account> = Account::new(db, options.name, options.currency).await?;

    // Note: could probably expect here, because the create function does not change
    //       the return value of the CREATE statement.
    account.ok_or(Error::RecordNotFound)
}

pub async fn read(db: &Surreal<Db>, account_id: RecordId) -> Result<Account, Error> {
    let account: Option<Account> = db
        .query("SELECT * FROM account WHERE id = $account_id")
        .bind(("account_id", account_id))
        .await?
        .take(0)?;

    account.ok_or(Error::RecordNotFound)
}

pub async fn update(db: &Surreal<Db>, account: Account) -> Result<(), surrealdb::Error> {
    let _: Option<crate::Record> = db
        .update(("account", account.id.key().clone()))
        .merge(account)
        .await?;

    Ok(())
}

pub async fn delete(db: &Surreal<Db>, account_id: RecordId) -> Result<(), surrealdb::Error> {
    db.query(
        r#"
    DELETE account WHERE id = $account_id;
    DELETE transaction WHERE account = $account_id;"#,
    )
    .bind(("account_id", account_id))
    .await
    .map(|_| ())
}

pub async fn list_accounts(db: &Surreal<Db>) -> Result<Vec<AccountIdentifiers>, surrealdb::Error> {
    let accounts: Vec<Account> = db.select("account").await?;

    Ok(accounts
        .into_iter()
        .map(|account| AccountIdentifiers {
            name: account.data.name,
            id: account.id,
        })
        .collect())
}

pub async fn list_accounts_with_details(
    db: &Surreal<Db>,
) -> Result<Vec<Account>, surrealdb::Error> {
    db.select("account").await
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
    Ok(sum.unwrap_or(0.0))
}
