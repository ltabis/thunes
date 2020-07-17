// account.rs
// create a new account.

use crate::args::arg::Arg;
use crate::accounts::account;
use crate::accounts::record;
use std::vec::Vec;

pub fn new_account(rd: &mut record::Record, args: &Vec<Arg>) {
    
    if rd.accounts.iter().find(|&account| account.name == args[0].value).is_some() {
	println!("Account {} already exists.", args[0].value);
	return;
    }

    rd.accounts.push(account::Account {
	name: String::from(&args[0].value),
	entries: Vec::new(),
    });

    println!("Account {} created.", args[0].value);
}
