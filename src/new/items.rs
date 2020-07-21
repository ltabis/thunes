// account.rs
// create a new account.

use crate::args::arg::Arg;
use crate::accounts::account::{Account, account_exists};
use crate::accounts::entry::{Entry, entry_exists};
use crate::accounts::record;
use std::vec::Vec;
use chrono::Utc;

pub fn new_item(rd: &mut record::Record, args: &mut Vec<Arg>) {

    if args.len() == 1 {
	new_account(rd, args);
    } else if args.len() > 1 {
	new_entry(rd, args);
    }
}

fn new_account(rd: &mut record::Record, args: &Vec<Arg>) {

    if account_exists(&rd, args) {
	// TODO: encapsulated error messages.
	eprintln!("Account '{}' already exists.", args[0].value);
	return;
    }
    
    rd.accounts.push(Account {
	name: String::from(&args[0].value),
	balance: 0.0,
	currency: String::from("$"),
	entries: Vec::new(),
    });

    println!("Account '{}' created.", args[0].value);
}

fn new_entry(rd: &mut record::Record, args: &Vec<Arg>) {

    if !account_exists(&rd, args) {
	// TODO: encapsulated error messages.
	eprintln!("Account '{}' doesn't exists.", args[0].value);
	return;
    }

    if args.len() == 2 {
	// TODO: encapsulated error messages.
	eprintln!("Please specify an amount.");
	return;
    }

    // FIXME: That's some shitty code.
    let index = rd.accounts
	.iter()
	.position(|ac| ac.name == args[0].value)
	.unwrap();
    let ac: &mut Account = &mut rd.accounts[index];

    if entry_exists(ac, args) {
	// TODO: encapsulated error messages.
	eprintln!("The '{}' entry already exists.", args[1].value);
	return;
    }

    let label = String::from(&args[1].value);
    let amount = match args[2].value.parse::<f64>() {
	Ok(v) => v,
	Err(_) => { eprintln!("Please specify a valid amount."); return; },
    };
    let date = if args.len() >= 4 {
	String::from(&args[3].value)
    } else {
	String::from(Utc::now().format("%a %b %e %T %Y").to_string())
    };
    let note = if args.len() == 5 {
	String::from(&args[4].value)
    } else {
	String::new()
    };

    ac.entries.push(Entry {
	label,
	amount,
	date,
	note,
    });

    println!("New entry '{}' created.", args[1].value);
}
