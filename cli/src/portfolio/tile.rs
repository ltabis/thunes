use crate::Error;
use surrealdb::{engine::local::Db, Surreal};

#[derive(ts_rs::TS)]
#[ts(export, tag = "type", content = "data")]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum Inner {
    Currency(super::currency::Tile),
    Budget(super::budget::Tile),
}

#[derive(ts_rs::TS)]
#[ts(export, rename = "PortfolioTile")]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Tile {
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
    #[serde(flatten)]
    pub inner: Inner,
    pub order: usize,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TileWithoutId {
    #[serde(flatten)]
    pub inner: Inner,
    pub order: usize,
}

#[derive(ts_rs::TS)]
#[ts(export, rename = "WriteTileOptions")]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WriteOptions {
    pub content: Inner,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CountResult {
    count: usize,
}

pub async fn write(db: &Surreal<Db>, options: WriteOptions) -> Result<Tile, Error> {
    let order: Option<CountResult> = db
        .query("SELECT count() FROM tile GROUP ALL")
        .await?
        .take(0)?;

    let order = order.ok_or(Error::RecordNotFound)?.count;

    db.create("tile")
        .content(TileWithoutId {
            inner: options.content,
            order,
        })
        .await?
        .ok_or(Error::RecordNotFound)
}

pub async fn read(db: &Surreal<Db>, id: surrealdb::RecordId) -> Result<Tile, Error> {
    let query = "SELECT * FROM tile WHERE id = $id";
    let tile: Option<Tile> = db.query(query).bind(("id", id)).await?.take(0)?;

    tile.ok_or(Error::RecordNotFound)
}

pub async fn list(db: &Surreal<Db>) -> Result<Vec<Tile>, surrealdb::Error> {
    db.query("SELECT * FROM tile ORDER BY order").await?.take(0)
}

pub async fn update(db: &Surreal<Db>, tile: Tile) -> Result<(), surrealdb::Error> {
    let _: Option<crate::Record> = db
        .update(("tile", tile.id.key().clone()))
        .merge(tile)
        .await?;

    Ok(())
}

pub async fn delete(db: &Surreal<Db>, id: surrealdb::RecordId) -> Result<(), surrealdb::Error> {
    let _: Option<Tile> = db.delete(id).await?;

    Ok(())
}
