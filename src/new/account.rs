// account.rs
// create a new account.

use crate::args::arg::Arg;

pub fn new_account(args: &Vec<Arg>) {
    println!("printing args =>");
    for arg in args {
	println!("   - {}", arg.value);
    }
}
