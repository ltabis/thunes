// dispatch.rs
// Dispatch arguments into there specific functions.

use crate::args::arg;
use std::env;

pub fn dispatch_args(args: &arg::Block) -> bool {

    let command = match env::args().nth(1) {
	Some(cmd) => cmd,
	None => return false,
    };

    let block = &args.blocks[0];

    if block.short == command || block.long == command {
	println!("args matched with {}", block);
	return true;
    }

    false
}
