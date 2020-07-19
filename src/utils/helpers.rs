// helpers.rs
// Method that output helps for the user.

use std::vec::Vec;
use crate::args::arg;
use crate::accounts::record;

// Function pointer for a block.
pub fn display_help(_rd: &mut record::Record, _args: &mut Vec<arg::Arg>) {
    help();
}

pub fn help() {
    println!("usage: accounts-cli
	     [--new <account> [<label> <amount> [<date> <note>]]]
	     [--list [<account>]]
             TODO [--delete [<account> [<label>]]]
	     TODO [--set-currency <currency> [<account>]]

new          creates a new account or entry.
list         list all accounts or entries in an account.
");
}
