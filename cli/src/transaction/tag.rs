use surrealdb::{engine::local::Db, Surreal};

use crate::Record;

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Tag {
    pub label: String,
    pub color: Option<String>,
}

impl PartialEq for Tag {
    fn eq(&self, other: &Self) -> bool {
        self.label == other.label
    }
}

pub async fn read(db: &Surreal<Db>) -> Result<Vec<Tag>, surrealdb::Error> {
    db.select("tag").await
}

pub async fn create(db: &Surreal<Db>, tags: Vec<Tag>) -> Result<(), surrealdb::Error> {
    for tag in tags {
        let _: Option<Record> = db.upsert(("tag", &tag.label)).content(tag).await?;
    }

    Ok(())
}
