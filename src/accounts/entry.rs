// entry.rs
// Your entries per account.

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct Entry {
    pub label:  String,
    pub amount: f64,
    pub date:   String, // TODO: check if format available.
    pub note:   String
}
