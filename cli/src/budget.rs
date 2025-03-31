use crate::account::Account;
use crate::transaction::CategoryWithId;
use crate::Error;
use surrealdb::engine::local::Db;
use surrealdb::Surreal;

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Allocation {
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
    pub name: String,
    pub amount: f64,
    pub category: CategoryWithId,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub partition: surrealdb::RecordId,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Partition {
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
    pub name: String,
    pub color: String,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub budget: surrealdb::RecordId,
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
        accounts = $accounts);
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

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize)]
pub struct CreatePartitionOptions {
    pub name: String,
    pub color: String,
}

pub async fn create_partition(
    db: &Surreal<Db>,
    budget_id: surrealdb::RecordId,
    options: CreatePartitionOptions,
) -> Result<Partition, Error> {
    let query = r#"
    let $partition = (CREATE ONLY partition SET
        name   = $name,
        color  = $color,
        budget = $budget_id
    );
    RETURN $partition
    "#;

    let partition: Option<Partition> = db
        .query(query)
        .bind(("name", options.name))
        .bind(("color", options.color))
        .bind(("budget_id", budget_id))
        .await?
        .take(1)?;

    partition.ok_or(Error::RecordNotFound)
}

pub async fn read_partitions(
    db: &Surreal<Db>,
    budget: surrealdb::RecordId,
) -> Result<Vec<Partition>, Error> {
    let query = r#"SELECT * FROM partition WHERE budget = $budget"#;

    Ok(db.query(query).bind(("budget", budget)).await?.take(0)?)
}

pub async fn update_partition(db: &Surreal<Db>, options: Partition) -> Result<Partition, Error> {
    let query: &str = r#"
    UPDATE $partition SET
        name  = $name,
        color = $color;
    RETURN SELECT * FROM $partition;
    "#;

    let partition: Option<Partition> = db
        .query(query)
        .bind(("name", options.name))
        .bind(("color", options.color))
        .bind(("partition", options.id))
        .await?
        .take(1)?;

    partition.ok_or(Error::RecordNotFound)
}

pub async fn delete_partition(
    db: &Surreal<Db>,
    partition: surrealdb::RecordId,
) -> Result<(), surrealdb::Error> {
    db.query(
        r#"
        DELETE $partition;
        DELETE allocation WHERE partition = $partition;
        "#,
    )
    .bind(("partition", partition))
    .await
    .map(|_| ())
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize)]
pub struct CreateAllocationOptions {
    pub name: String,
    #[ts(type = "{ tb: string, id: { String: string }}", optional)]
    pub category: Option<surrealdb::RecordId>,
    pub amount: f64,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub partition: surrealdb::RecordId,
}

pub async fn create_allocation(
    db: &Surreal<Db>,
    options: CreateAllocationOptions,
) -> Result<Allocation, Error> {
    let query = r#"
    LET $allocation = (CREATE ONLY allocation SET
        name      = $name,
        category  = $category,
        amount    = $amount,
        partition = $partition);
    SELECT * FROM $allocation FETCH category;
    "#;

    let allocation: Option<Allocation> = db
        .query(query)
        .bind(("name", options.name))
        .bind(("partition", options.partition))
        .bind((
            "category",
            options.category.unwrap_or(("category", "other").into()),
        ))
        .bind(("amount", options.amount))
        .await?
        .take(1)?;

    allocation.ok_or(Error::RecordNotFound)
}

pub async fn read_allocations(
    db: &Surreal<Db>,
    partitions: Vec<surrealdb::RecordId>,
) -> Result<Vec<Allocation>, Error> {
    let query = r#"SELECT * FROM allocation WHERE partition IN $partitions FETCH category"#;

    Ok(db
        .query(query)
        .bind(("partitions", partitions))
        .await?
        .take(0)?)
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, serde::Deserialize)]
pub struct UpdateAllocationOptions {
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
    pub name: String,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub category: surrealdb::RecordId,
    pub amount: f64,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub partition: surrealdb::RecordId,
}

pub async fn update_allocation(
    db: &Surreal<Db>,
    options: UpdateAllocationOptions,
) -> Result<Allocation, Error> {
    let query = r#"
    UPDATE $allocation SET
        name  = $name,
        partition = $partition,
        category  = $category,
        amount    = $amount;
    RETURN SELECT * from $allocation FETCH category;
    "#;

    let allocation: Option<Allocation> = db
        .query(query)
        .bind(("name", options.name))
        .bind(("partition", options.partition))
        .bind(("allocation", options.id))
        .bind(("category", options.category))
        .bind(("amount", options.amount))
        .await?
        .take(1)?;

    allocation.ok_or(Error::RecordNotFound)
}

pub async fn delete_allocation(
    db: &Surreal<Db>,
    allocation: surrealdb::RecordId,
) -> Result<(), surrealdb::Error> {
    db.query("DELETE $allocation;")
        .bind(("allocation", allocation))
        .await
        .map(|_| ())
}
