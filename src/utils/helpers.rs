// helpers.rs
// Method that output helps for the user.

use std::vec::Vec;
use crate::args::arg;
use crate::accounts::record;

// Function pointer for a block.
pub fn display_help(_rd: &mut record::Record, _args: &Vec<arg::Arg>) {
    help();
}

pub fn help() {
    println!("usage: accounts-cli
	     WIP [--new <account> [<label> <amount> [<date> <note>]]]
	     TODO [--list [<account>]]
             TODO [--delete [<account> [<label>]]]
	     TODO [--set-currency <currency> [<account>]]"
    );
}
