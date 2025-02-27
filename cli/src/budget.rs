use crate::account::Account;
use crate::Error;
use surrealdb::engine::local::Db;
use surrealdb::Surreal;

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum Type {
    Split { accounts: Vec<Account> },
    // ZeroBased,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Data {
    pub name: String,
    pub income: f64,
    pub inner: Type,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Budget {
    #[serde(flatten)]
    pub data: Data,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
}

impl Budget {
    pub async fn new_split(
        db: &Surreal<Db>,
        name: impl Into<String>,
        income: f64,
        accounts: Vec<Account>,
    ) -> Result<Option<Self>, Error> {
        db.create("budget")
            .content(Data {
                name: name.into(),
                income: income.into(),
                inner: Type::Split { accounts },
            })
            .await
            .map_err(core::convert::Into::into)
    }
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize)]
pub struct CreateSplitBudgetOptions {
    pub name: String,
    pub income: f64,
    pub accounts: Vec<Account>,
}

pub async fn create_split(
    db: &Surreal<Db>,
    options: CreateSplitBudgetOptions,
) -> Result<Budget, Error> {
    let budget = Budget::new_split(db, options.name, options.income, options.accounts).await?;

    // Note: could probably expect here, because the create function does not change
    //       the return value of the CREATE statement.
    budget.ok_or(Error::RecordNotFound)
}

pub async fn read(db: &Surreal<Db>, budget_id: surrealdb::RecordId) -> Result<Budget, Error> {
    let budget: Option<Budget> = db
        .query("SELECT * FROM budget WHERE id = $budget_id")
        .bind(("budget_id", budget_id))
        .await?
        .take(0)?;

    budget.ok_or(Error::RecordNotFound)
}

pub async fn update(db: &Surreal<Db>, budget: Budget) -> Result<(), surrealdb::Error> {
    let _: Option<crate::Record> = db
        .update(("budget", budget.id.key().clone()))
        .merge(budget)
        .await?;

    Ok(())
}

pub async fn delete(
    db: &Surreal<Db>,
    budget_id: surrealdb::RecordId,
) -> Result<(), surrealdb::Error> {
    db.query("DELETE budget WHERE id = $budget_id;")
        .bind(("budget_id", budget_id))
        .await
        .map(|_| ())
}
