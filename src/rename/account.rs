// account.rs
// renames an account.

use crate::args::arg::Arg;
use crate::accounts::record::Record;
use crate::accounts::account::account_exists;
use colored::*;

pub fn rename_account(rd: &mut Record, args: &mut Vec<Arg>) {

    if !account_exists(&rd, args) {
        // TODO: encapsulated error messages.
        eprintln!("The '{}' account does not exists.", args[0].value.yellow());
        return;
    }

    let index = rd.accounts
        .iter()
        .position(|ac| ac.name == args[0].value)
        .unwrap();

    rd.accounts[index].name = String::from(&args[1].value);
    println!("Account '{}' renamed to '{}'.", args[0].value.yellow(), args[1].value.yellow());
}
