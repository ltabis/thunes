use crate::budget::partition::Partition;
use crate::budget::{reset_datetime_hms, Budget, ExpensesPeriod};
use crate::transaction::category::CategoryWithId;
use crate::transaction::TransactionWithId;
use crate::Error;
use surrealdb::engine::local::Db;
use surrealdb::{RecordId, Surreal};

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExpensesAllocation {
    // Total transaction amount for the allocation.
    pub transactions_total: f64,
    // Total theoretical maximum amount for the given allocation.
    pub allocations_total: f64,
    pub category: CategoryWithId,
    pub transactions: Vec<TransactionWithId>,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExpensesPartition {
    // Sums up all transactions part of the allocations of this partition.
    pub transactions_total: f64,
    // Total theoretical maximum amount for the given allocations of this partition.
    pub allocations_total: f64,
    pub inner: Partition,
    pub allocations: Vec<ExpensesAllocation>,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExpensesBudget {
    // Sums up all transactions that match all allocation of the budget.
    pub transactions_total: f64,
    // Total theoretical maximum amount for the given budget. Sums up all allocations
    // of all the partitions of this budget.
    pub allocations_total: f64,
    pub inner: Budget,
    pub partitions: Vec<ExpensesPartition>,
    pub income_total: f64,
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
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AllocationGroup {
    pub total: f64,
    pub category: CategoryWithId,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub partition: RecordId,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Deserialize)]
pub struct ReadExpensesOptions {
    pub period: ExpensesPeriod,
    #[ts(as = "String")]
    pub start_date: chrono::DateTime<chrono::Utc>,
}

pub async fn read(
    db: &Surreal<Db>,
    budget_id: surrealdb::RecordId,
    options: ReadExpensesOptions,
) -> Result<ReadExpensesResult, Error> {
    // Not using surrealdb time functions here because there is no way (right now)
    // to add a month to a datetime object.
    let start = reset_datetime_hms(options.start_date)?;
    let (start, end) = options.period.into_datetime(start)?;

    let mut response = db
        // FIXME: Queries that big should be placed in surql files
        .query(
            r#"LET $budget = (SELECT * FROM ONLY $budget_id FETCH accounts);
        RETURN $budget;
        LET $partitions = (SELECT * FROM partition WHERE budget = $budget.id);
        RETURN $partitions;
        RETURN SELECT math::sum(amount) AS total, category, partition FROM allocation WHERE partition IN $partitions.map(|$p| $p.id) GROUP BY category FETCH category;
        RETURN SELECT *
            FROM transaction
            WHERE account.id in $budget.accounts.map(|$a| $a.id)
            AND date >= <datetime>$start AND date <= <datetime>$end;
        "#,
        )
        .bind(("budget_id", budget_id))
        .bind(("start", start))
        .bind(("end", end))
        .await
        .map_err(Error::Database)?;

    // FIXME: Build the result structure using the query directly.
    let budget = response
        .take::<Option<Budget>>(1)?
        .ok_or(Error::RecordNotFound)?;
    let partitions = response.take::<Vec<Partition>>(3)?;
    let allocation_groups = response.take::<Vec<AllocationGroup>>(4)?;
    let transactions = response.take::<Vec<TransactionWithId>>(5)?;

    let period_factor = match options.period {
        ExpensesPeriod::Monthly => 1.0,
        ExpensesPeriod::Trimestrial => 3.0,
        ExpensesPeriod::Yearly => 12.0,
    };

    let partitions: Vec<ExpensesPartition> = partitions
        .into_iter()
        .map(|partition: Partition| {
            let allocations: Vec<ExpensesAllocation> = allocation_groups
                .iter()
                .filter(|allocation| allocation.partition == partition.id)
                .map(|allocation_group| {
                    let transactions: Vec<TransactionWithId> = transactions
                        .iter()
                        .filter(|&transaction| transaction.category == allocation_group.category.id)
                        .cloned()
                        .collect();
                    let transactions_total = transactions
                        .iter()
                        .fold(0.0, |acc, transactions| acc + transactions.inner.amount);

                    ExpensesAllocation {
                        transactions,
                        transactions_total,
                        allocations_total: allocation_group.total
                        // Need to apply the period factor on each allocations instead of applying it on the total
                        // because the frontend breaks down the allocations to display details. 
                        * period_factor,
                        category: allocation_group.category.clone(),
                    }
                })
                .collect();

            ExpensesPartition {
                allocations_total: allocations
                    .iter()
                    .fold(0.0, |acc, allocation| acc + allocation.allocations_total),
                transactions_total: allocations
                    .iter()
                    .fold(0.0, |acc, allocation| acc + allocation.transactions_total),
                inner: partition,
                allocations,
            }
        })
        .collect();

    Ok(ReadExpensesResult {
        period_start: start.to_string(),
        period_end: end.to_string(),
        budget: ExpensesBudget {
            allocations_total: partitions
                .iter()
                .fold(0.0, |acc, partition| acc + partition.allocations_total),
            transactions_total: partitions
                .iter()
                .fold(0.0, |acc, partition| acc + partition.transactions_total),
            income_total: budget.income * period_factor,
            inner: budget,
            partitions,
        },
    })
}
