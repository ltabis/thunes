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

    // DEBUG
    println!("args matched with {}", args.blocks[command]);
    return command as i32;
}

pub fn fill_command(env: &mut env::Args, block: &mut arg::Block) {

    for arg in &mut block.args {
	arg.value = match env.next() {
	    Some(val) => val,
	    None => return,
	}
    }

    for next in &mut block.blocks {
	fill_command(env, next);
    }
}

pub fn execute_blocks(block: &arg::Block) {

    match block.fun {
	Some(fun) => fun(&block.args),
	None => ()
    };

    for next in &block.blocks {
	execute_blocks(&next);
    }
}
