use surrealdb::{engine::local::Db, Surreal};

use crate::{transaction::category::CategoryWithId, Error};

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
#[derive(Debug, serde::Deserialize)]
pub struct CreateAllocationOptions {
    pub name: String,
    #[ts(type = "{ tb: string, id: { String: string }}", optional)]
    pub category: Option<surrealdb::RecordId>,
    pub amount: f64,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub partition: surrealdb::RecordId,
}

pub async fn create(
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

pub async fn read(
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

pub async fn update(
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

pub async fn delete(
    db: &Surreal<Db>,
    allocation: surrealdb::RecordId,
) -> Result<(), surrealdb::Error> {
    db.query("DELETE $allocation;")
        .bind(("allocation", allocation))
        .await
        .map(|_| ())
}
