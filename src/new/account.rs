// account.rs
// create a new account.

use crate::args::arg::Arg;

pub fn new_account(args: &Vec<Arg>) {
    println!("Account {} created.", args[0].value);
}
