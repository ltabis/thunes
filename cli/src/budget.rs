use crate::account::Account;
use crate::Error;
use surrealdb::engine::local::Db;
use surrealdb::Surreal;

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Type {
    Split,
    // ZeroBased,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Budget {
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
    pub name: String,
    pub r#type: Type,
    pub income: f64,
    pub accounts: Vec<Account>,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct BudgetIdentifiers {
    pub name: String,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
}

pub async fn list(db: &Surreal<Db>) -> Result<Vec<BudgetIdentifiers>, surrealdb::Error> {
    let budgets: Vec<Budget> = db
        .query("SELECT * FROM budget FETCH accounts")
        .await?
        .take(0)?;

    Ok(budgets
        .into_iter()
        .map(|budget| BudgetIdentifiers {
            name: budget.name,
            id: budget.id,
        })
        .collect())
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize)]
pub struct CreateSplitBudgetOptions {
    pub name: String,
    pub income: f64,
    #[ts(type = "{ tb: string, id: { String: string }}[]")]
    pub accounts: Vec<surrealdb::RecordId>,
}

pub async fn create_split(
    db: &Surreal<Db>,
    options: CreateSplitBudgetOptions,
) -> Result<Budget, Error> {
    let query = r#"
    LET $budget = (CREATE budget SET
        name = $name,
        type = $type,
        income = $income,
        accounts = $accounts);
    RETURN SELECT * FROM $budget.id FETCH accounts"#;

    let budget: Option<Budget> = db
        .query(query)
        .bind(("name", options.name))
        .bind(("type", Type::Split))
        .bind(("income", options.income))
        .bind(("accounts", options.accounts))
        .await?
        .take(1)?;

    budget.ok_or(Error::RecordNotFound)
}

pub async fn read(db: &Surreal<Db>, budget_id: surrealdb::RecordId) -> Result<Budget, Error> {
    let budget: Option<Budget> = db
        .query("SELECT * FROM budget WHERE id = $budget_id FETCH accounts")
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
