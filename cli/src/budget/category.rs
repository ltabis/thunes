use surrealdb::{engine::local::Db, Surreal};

use crate::{
    budget::{reset_datetime_hms, ExpensesPeriod},
    transaction::TransactionWithId,
    Error,
};

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ReadCategoryResult {
    pub period_start: String,
    pub period_end: String,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub category: surrealdb::RecordId,
    pub transactions: Vec<TransactionWithId>,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Debug, Clone, serde::Deserialize)]
pub struct ReadCategoryOptions {
    pub period: ExpensesPeriod,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub category: surrealdb::RecordId,
    #[ts(as = "String")]
    pub start_date: chrono::DateTime<chrono::Utc>,
}

pub async fn read(
    db: &Surreal<Db>,
    budget_id: surrealdb::RecordId,
    options: ReadCategoryOptions,
) -> Result<ReadCategoryResult, Error> {
    // Not using surrealdb time functions here because there is no way (right now)
    // to add a month to a datetime object.
    let start = reset_datetime_hms(options.start_date)?;
    let (start, end) = options.period.into_datetime(start)?;

    let mut response = db
        // FIXME: Queries that big should be placed in surql files
        .query(
            r#"LET $budget = (SELECT * FROM ONLY $budget_id FETCH accounts);
    RETURN SELECT * FROM transaction
    WHERE account.id in $budget.accounts.map(|$a| $a.id)
    AND category.id = $category_id
    AND date >= <datetime>$start AND date <= <datetime>$end;
        "#,
        )
        .bind(("budget_id", budget_id))
        .bind(("category_id", options.category.clone()))
        .bind(("start", start))
        .bind(("end", end))
        .await
        .map_err(Error::Database)?;

    let transactions = response.take::<Vec<TransactionWithId>>(1)?;

    Ok(ReadCategoryResult {
        period_start: start.to_string(),
        period_end: end.to_string(),
        category: options.category,
        transactions,
    })
}
