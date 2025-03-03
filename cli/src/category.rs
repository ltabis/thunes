#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Icon {
    Transport,
    Accommodation,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Category {
    pub name: String,
    pub icon: Icon, // ??
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct CategoryWithId {
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
    #[serde(flatten)]
    pub data: Category,
}
