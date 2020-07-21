// account.rs
// Manage your accounts.

use crate::accounts::entry;
use crate::accounts::record::Record;
use crate::args::arg::Arg;
use serde::{Deserialize, Serialize};
use std::vec::Vec;

// -- Accounts structure

#[derive(Serialize, Deserialize)]
pub struct Account {
    pub name:  String,
    pub balance: f64,
    pub currency: String,
    pub entries: Vec<entry::Entry>
}

impl Account {
    pub fn new(name: String, entry: entry::Entry) -> Account {
	Account {
	    name: name,
	    balance: 0.0,
	    currency: String::from("$"),
	    entries: vec![entry]
	}
    }
}

impl std::fmt::Display for Account {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "account: '{}'", &self.name)
    }
}

pub fn account_exists(rd: &Record, args: &Vec<Arg>) -> bool {
    if args.len() == 0 {
	return false;
    }

    rd.accounts
        .iter()
        .find(|&account| account.name == args[0].value)
        .is_some()
}
