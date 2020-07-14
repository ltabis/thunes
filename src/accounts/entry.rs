// entry.rs
// Your entries per account.

pub struct Entry {
    pub label:  String,
    pub amount: f64,
    pub date:   String, // TODO: check if format available.
    pub note:   String
}
