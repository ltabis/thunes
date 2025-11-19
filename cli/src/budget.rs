use crate::account::Account;
use crate::Error;
use surrealdb::engine::local::Db;
use surrealdb::Surreal;

pub mod allocation;
pub mod expenses;
pub mod partition;

/// What to display on the budget widget.
#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct View {
    expenses: bool,
    allocations: bool,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Budget {
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
    pub name: String,
    pub income: f64,
    pub currency: String,
    pub accounts: Vec<Account>,
    pub view: View,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct BudgetIdentifiers {
    pub name: String,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
}

pub async fn list(db: &Surreal<Db>) -> Result<Vec<Budget>, surrealdb::Error> {
    db.query("SELECT * FROM budget FETCH accounts")
        .await?
        .take(0)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize)]
pub struct CreateSplitBudgetOptions {
    pub name: String,
    pub income: f64,
    pub currency: String,
    #[ts(type = "{ tb: string, id: { String: string }}[]")]
    pub accounts: Vec<surrealdb::RecordId>,
}

pub async fn create_split(
    db: &Surreal<Db>,
    options: CreateSplitBudgetOptions,
) -> Result<Budget, Error> {
    let query = r#"
    LET $budget = (CREATE ONLY budget SET
        name = $name,
        partitions = $partitions,
        income = $income,
        currency = $currency,
        accounts = $accounts,
        view = { expenses: false, allocations: false });
    CREATE partition SET name = "Needs",       color = "red",    budget = $budget.id;
    CREATE partition SET name = "Wants",       color = "yellow", budget = $budget.id;
    CREATE partition SET name = "Investments", color = "blue",   budget = $budget.id;
    RETURN SELECT * FROM $budget.id FETCH accounts"#;

    let budget: Option<Budget> = db
        .query(query)
        .bind(("name", options.name))
        .bind(("income", options.income))
        .bind(("currency", options.currency))
        .bind(("accounts", options.accounts))
        .await?
        .take(4)?;

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
    db.query(
        r#"
        DELETE budget WHERE id = $budget_id;
        LET $partitions = (SELECT id FROM partition WHERE budget = $budget_id);
        DELETE $partitions;
        DELETE allocation WHERE partition IN $partitions;
        "#,
    )
    .bind(("budget_id", budget_id))
    .await
    .map(|_| ())
}
