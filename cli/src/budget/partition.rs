use surrealdb::{engine::local::Db, Surreal};

use crate::Error;

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
#[derive(Debug, serde::Deserialize)]
pub struct CreatePartitionOptions {
    pub name: String,
    pub color: String,
}

pub async fn create(
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

pub async fn read(db: &Surreal<Db>, budget: surrealdb::RecordId) -> Result<Vec<Partition>, Error> {
    let query = r#"SELECT * FROM partition WHERE budget = $budget"#;

    Ok(db.query(query).bind(("budget", budget)).await?.take(0)?)
}

pub async fn update(db: &Surreal<Db>, options: Partition) -> Result<Partition, Error> {
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

pub async fn delete(
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
