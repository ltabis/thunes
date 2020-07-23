// items.rs
// Listing of items from the record.

use crate::accounts::account::{Account, account_exists};
use crate::accounts::record::Record;
use crate::args::arg::Arg;

use std::vec::Vec;
use colored::*;

pub fn list_items(rd: &mut Record, args: &mut Vec<Arg>) {

    if args.len() == 0 {
	list_accounts(rd);
    } else {
	list_entries(rd, args);
    }
}

fn list_accounts(rd: &mut Record) {
    let mut table = table!(["Accounts"]);

    for account in &rd.accounts {
	table.add_row(row![account.name]);
    }

    table.printstd();
}

fn list_entries(rd: &mut Record, args: &mut Vec<Arg>) {

    if !account_exists(&rd, args) {
	// TODO: encapsulated error messages.
	eprintln!("The account '{}' doesn't exists.", args[0].value.yellow());
	return;
    }
    
    let mut table = table!([bFy->"Label", bFy->"Amount", bFy->"Date", bFy->"Note"]);
    // FIXME: That's some shitty code.
    let index = rd.accounts
        .iter()
        .position(|ac| ac.name == args[0].value)
        .unwrap();
    let ac: &mut Account = &mut rd.accounts[index];

    if ac.entries.len() == 0 {
	// TODO: encapsulated error messages.
	eprintln!("No entries available for the '{}' account.", ac.name.yellow());
	return;
    }

    for entry in &ac.entries {
	table.add_row(row![Fc->entry.label, format!("{} {}", entry.amount.to_string().green(), ac.currency.blue()), entry.date, entry.note]);
    }

    table.printstd();
}
