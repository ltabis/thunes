// show.rs
// Show or set a currency for an account.

use crate::args::arg::Arg;
use crate::accounts::record::Record;
use crate::accounts::account::{Account, account_exists};
use colored::*;

pub fn currency(rd: &mut Record, args: &mut Vec<Arg>) {

    if !account_exists(&rd, args) {
        // TODO: encapsulated error messages.
        if args.len() > 0 {
            eprintln!("The '{}' account does not exists.", args[0].value.yellow());
        } else {
            eprintln!("You didn't specified any account.");
        }
        return;
    }

    let index = rd.accounts
        .iter()
        .position(|ac| ac.name == args[0].value)
        .unwrap();

    if args.len() == 1 {
        show_currency(&rd.accounts[index]);
    } else if args.len() > 1 {
        set_currency(&mut rd.accounts[index], &args[1].value);
    }
}

fn show_currency(account: &Account) {
    println!("'{}' currency: '{}'.", account.name.yellow(), account.currency.blue());
}

fn set_currency(account: &mut Account, currency: &String) {

    account.currency = currency.to_string();
    println!("'{}' balance set to {}.", account.name.yellow(), account.currency.blue());
}
