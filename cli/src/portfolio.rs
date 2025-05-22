pub mod currency;

#[derive(ts_rs::TS)]
#[ts(export, tag = "type", content = "data", rename = "PortfolioTile")]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum Tile {
    Account(currency::Tile),
}
