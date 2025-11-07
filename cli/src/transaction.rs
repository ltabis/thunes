use surrealdb::RecordId;

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

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Transaction {
    #[ts(as = "String")]
    pub date: chrono::DateTime<chrono::Utc>,
    pub amount: f64,
    pub description: String,
    pub tags: Vec<Tag>,
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct TransactionWithId {
    #[serde(flatten)]
    pub inner: Transaction,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub id: RecordId,
    #[ts(skip)]
    pub account: RecordId,
    #[ts(type = "{ tb: string, id: { String: string }}")]
    pub category: surrealdb::RecordId,
}
