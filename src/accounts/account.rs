// account.rs
// Manage your accounts.

use serde::{Deserialize, Serialize};
use crate::accounts::entry;
use std::vec::Vec;

// -- Accounts structure

#[derive(Serialize, Deserialize)]
pub struct Account {
    pub name:  String,
    pub entries: Vec<entry::Entry>
}

impl Account {
    pub fn new(name: String, entry: entry::Entry) -> Account {
	Account {
	    name: name,
	    entries: vec![entry]
	}
    }
}
