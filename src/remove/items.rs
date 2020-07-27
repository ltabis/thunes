// items.rs
// deleting accounts or entries.

use crate::args::arg::Arg;
use crate::accounts::record::Record;
use crate::accounts::account::account_exists;
use crate::accounts::entry::{EntryType, entry_exists};
use colored::*;

pub fn remove_item(rd: &mut Record, args: &mut Vec<Arg>) {

    if !account_exists(&rd, args) {
        // TODO: encapsulated error messages.
        eprintln!("The '{}' account does not exists.", args[0].value.yellow());
        return;
    }

    if args.len() == 1 {
        remove_account(rd, args);
    } else if args.len() > 1 {
        remove_entry(rd, args);
    }
}

fn remove_account(rd: &mut Record, args: &Vec<Arg>) {

    let index = rd.accounts
        .iter()
        .position(|ac| ac.name == args[0].value)
        .unwrap();

    rd.accounts.remove(index);

    println!("Account '{}' removed.", args[0].value.yellow());
}

fn remove_entry(rd: &mut Record, args: &Vec<Arg>) {

    let a_index = rd.accounts
        .iter()
        .position(|ac| ac.name == args[0].value)
        .unwrap();

    if !entry_exists(&rd.accounts[a_index], args) {
        // TODO: encapsulated error messages.
        eprintln!("The '{}' entry in '{}' does not exists.", args[1].value.cyan(), args[0].value.yellow());
        return;
    }

    let e_index = rd.accounts[a_index]
	.entries
        .iter()
        .position(|ac| ac.label == args[1].value)
        .unwrap();

    match rd.accounts[a_index].entries[e_index].entry_type {
	EntryType::Deposit => rd.accounts[a_index].balance -= rd.accounts[a_index].entries[e_index].amount,
	EntryType::Withdrawal => rd.accounts[a_index].balance += rd.accounts[a_index].entries[e_index].amount,
    }

    rd.accounts[a_index].entries.remove(e_index);
    println!("Entry '{}' removed from '{}'.", args[1].value.cyan(), args[0].value.yellow());
}
