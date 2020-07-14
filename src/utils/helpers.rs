// helpers.rs
// Method that output helps for the user.

pub fn help() {
    println!("usage: accounts-cli
	     WIP [--new <account> [<label> <ammount> [<date> <note>]]]
	     TODO [--list [<account>]]
             TODO [--delete [<account> [<label>]]]
	     TODO [--set-currency <currency> [<account>]]"
    );
}
