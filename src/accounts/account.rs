// account.rs
// Manage your accounts.

use crate::accounts::entry;
use std::vec::Vec;

pub struct Account {
    pub name:  String,
    pub items: Vec<entry::Entry>
}

impl Account {
    pub fn new(name: String, entry: entry::Entry) -> Account {
	Account {
	    name: name,
	    items: vec![entry]
	}
    }
}
