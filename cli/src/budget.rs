use crate::account::Account;
use crate::transaction::{CategoryWithId, TransactionWithId};
use crate::Error;
use chrono::Datelike;
use surrealdb::engine::local::Db;
use surrealdb::Surreal;

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

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExpensesAllocation {
    pub inner: Allocation,
    pub transactions: Vec<TransactionWithId>,
    pub total: f64,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExpensesPartition {
    pub inner: Partition,
    pub allocations: Vec<ExpensesAllocation>,
    pub total: f64,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExpensesBudget {
    pub inner: Budget,
    pub partitions: Vec<ExpensesPartition>,
    pub total: f64,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ReadExpensesResult {
    pub period_start: String,
    pub period_end: String,
    pub budget: ExpensesBudget,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Deserialize)]
pub enum ExpensesPeriod {
    Monthly,
    Trimestrial,
    Yearly,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Deserialize)]
pub struct ReadExpensesOptions {
    pub period: ExpensesPeriod,
    pub period_index: u32,
}

pub async fn read_expenses(
    db: &Surreal<Db>,
    budget_id: surrealdb::RecordId,
    options: ReadExpensesOptions,
) -> Result<ReadExpensesResult, Error> {
    // Not using surrealdb time functions here because there is no way (right now)
    // to add a month to a datetime object.
    let now = chrono::Utc::now();

    let (before, after) = match options.period {
        ExpensesPeriod::Monthly => {
            let before = now
                .date_naive()
                .with_day(1)
                .unwrap()
                .checked_sub_months(chrono::Months::new(options.period_index))
                .unwrap();

            let after = now
                .date_naive()
                .with_day(1)
                .unwrap()
                .checked_add_months(chrono::Months::new(1))
                .unwrap()
                .checked_sub_months(chrono::Months::new(options.period_index))
                .unwrap()
                .checked_sub_days(chrono::Days::new(1))
                .unwrap();

            (before, after)
        }
        ExpensesPeriod::Trimestrial => {
            let before = now
                .date_naive()
                .with_day(1)
                .unwrap()
                .checked_sub_months(chrono::Months::new(2))
                .unwrap()
                .checked_sub_months(chrono::Months::new(options.period_index))
                .unwrap();

            let after = now
                .date_naive()
                .with_day(1)
                .unwrap()
                .checked_add_months(chrono::Months::new(1))
                .unwrap()
                .checked_sub_months(chrono::Months::new(options.period_index))
                .unwrap()
                .checked_sub_days(chrono::Days::new(1))
                .unwrap();

            (before, after)
        }
        ExpensesPeriod::Yearly => {
            let year = now.year() - options.period_index as i32;

            let before = now
                .date_naive()
                .with_year(year)
                .unwrap()
                .with_month(1)
                .unwrap()
                .with_day(1)
                .unwrap();

            let after = now
                .date_naive()
                .with_year(year)
                .unwrap()
                .with_month(12)
                .unwrap()
                .with_day(31)
                .unwrap();

            (before, after)
        }
    };

    let mut response = db
        .query(
            r#"LET $budget = (SELECT * FROM ONLY $budget_id FETCH accounts);
        RETURN $budget;
        LET $partitions = (SELECT * FROM partition WHERE budget = $budget.id);
        RETURN $partitions;
        RETURN SELECT * FROM allocation WHERE partition IN $partitions.map(|$p| $p.id) FETCH category;
        RETURN SELECT *
            FROM transaction
            WHERE account.id in $budget.accounts.map(|$a| $a.id)
            AND date >= <datetime>$before AND date <= <datetime>$after;
        "#,
        )
        .bind(("budget_id", budget_id))
        .bind(("before", before))
        .bind(("after", after))
        .await
        .unwrap();

    // FIXME: Build the result structure using the query directly.
    let budget = response
        .take::<Option<Budget>>(1)?
        .ok_or(Error::RecordNotFound)?;
    let partitions = response.take::<Vec<Partition>>(3)?;
    let allocations = response.take::<Vec<Allocation>>(4)?;
    let transactions = response.take::<Vec<TransactionWithId>>(5)?;

    let partitions: Vec<ExpensesPartition> = partitions
        .into_iter()
        .map(|partition| {
            let allocations: Vec<ExpensesAllocation> = allocations
                .iter()
                .filter(|allocation| allocation.partition == partition.id)
                .map(|allocation| {
                    let transactions: Vec<TransactionWithId> = transactions
                        .iter()
                        .filter(|&transaction| transaction.category == allocation.category.id)
                        .cloned()
                        .collect();
                    let total = transactions
                        .iter()
                        .fold(0.0, |acc, transactions| acc + transactions.inner.amount);

                    ExpensesAllocation {
                        inner: allocation.clone(),
                        transactions,
                        total,
                    }
                })
                .collect();

            let total = allocations
                .iter()
                .fold(0.0, |acc, allocation| acc + allocation.total);

            ExpensesPartition {
                inner: partition,
                allocations,
                total,
            }
        })
        .collect();

    let total = partitions
        .iter()
        .fold(0.0, |acc, partition| acc + partition.total);

    Ok(ReadExpensesResult {
        period_start: before.to_string(),
        period_end: after.to_string(),
        budget: ExpensesBudget {
            inner: budget,
            partitions,
            total,
        },
    })
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
