use crate::Error;
use surrealdb::{engine::local::Db, RecordId, Surreal};

#[derive(ts_rs::TS, Debug, Clone, serde::Serialize, serde::Deserialize)]
#[ts(export)]
pub struct Data {
    pub name: String,
    pub currency: String,
    /// Save grid sorting state.
    #[serde(default)]
    pub transaction_grid_sort_model: Vec<serde_json::Value>,
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
                transaction_grid_sort_model: vec![],
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
