// show.rs
// Shows or set current account balance.

use crate::args::arg::Arg;
use crate::accounts::record::Record;
use crate::accounts::account::{Account, account_exists};
use colored::*;

pub fn balance(rd: &mut Record, args: &mut Vec<Arg>) {

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
	show_balance(&rd.accounts[index]);
    } else if args.len() > 1 {
	set_balance(&mut rd.accounts[index], &args[1].value);
    }
}

pub fn show_balance(ac: &Account) {
    let amount = if ac.balance < 0.0 {
	ac.balance.to_string().red()
    } else {
	ac.balance.to_string().green()
    };

    println!("'{}' balance: {}{}.", ac.name.yellow(), amount, ac.currency.blue());
}

fn set_balance(account: &mut Account, balance: &String) {

    account.balance = match balance.parse::<f64>() {
        Ok(v) => v,
        Err(_) => { eprintln!("Please specify a valid amount."); return; },
    };

    println!("'{}' balance set to {}.", account.name.yellow(), account.balance.to_string().green());
}
