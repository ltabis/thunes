#[derive(ts_rs::TS)]
#[ts(export, rename = "BudgetTileType")]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum Type {
    Pie,
    HorizontalBars,
}

#[derive(ts_rs::TS)]
#[ts(export, rename = "BudgetTile")]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Tile {
    pub t: Type,
    // FIXME: this is the budget id, using a string here because of the
    //        untagged and internally tagged enums do not support enum input
    //        error.
    pub budget: String,
}
