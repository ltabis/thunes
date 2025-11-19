use surrealdb::{engine::local::Db, Surreal};

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, Eq, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Icon {
    Transport,
    Accommodation,
    Subscription,
    Car,
    Other,
    GiftAndDonations,
    Bed,
    Savings,
    EducationAndFamily,
    Loan,
    ProfessionalFee,
    Taxes,
    SpareTimeActivities,
    InternalMovements,
    CashWithdrawal,
    Health,
    EverydayLife,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct CategoryWithId {
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: surrealdb::RecordId,
    pub name: String,
    pub icon: Icon,
    pub color: String,
    #[ts(type = "{ tb: string, id: { String: string }}", optional)]
    pub parent: Option<surrealdb::RecordId>,
}

pub async fn read(db: &Surreal<Db>) -> Result<Vec<CategoryWithId>, surrealdb::Error> {
    db.select("category").await
}
