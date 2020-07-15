// dispatch.rs
// Dispatch arguments into there specific functions.

use crate::args::arg;
use std::env;

pub fn check_args(args: &arg::Block) -> i32 {

    let command = match env::args().nth(1) {
	Some(cmd) => cmd,
	None => return -1,
    };

    let command = match args.blocks
	.iter()
	.position(|r| r.short == command || r.long == command) {
	    Some(index) => index,
	    None => return -1,
	};

    println!("args matched with {}", args.blocks[command]);
    return command as i32;
}
