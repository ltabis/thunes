// arg.rs
// A configurable argument struct.

use std::vec::Vec;
use crate::accounts::record;

// Function pointer for all blocks.
type ArgFun = Option<fn(&mut record::Record, &mut Vec<Arg>)>;

pub struct Arg {
    pub label: String,
    pub value: String,
    pub required: bool,
}

pub struct Block {
    pub short: String,
    pub long: String,
    pub args: Vec<Arg>,
    pub blocks: Vec<Block>,
    pub fun: ArgFun,
}

impl Block {
    pub fn new(short: &str, long: &str, fun: ArgFun) -> Block {
	Block {
	    short: String::from(&short[..]),
	    long: String::from(&long[..]),
	    args: Vec::new(),
	    blocks: Vec::new(),
	    fun,
	}
    }

    pub fn register_args(mut self, args: Vec<Arg>) -> Self {
	for arg in args {
	    self.args.push(arg);
	}

	self
    }

    pub fn register_args_ref(&mut self, args: Vec<Arg>) {
	for arg in args {
	    self.args.push(arg);
	}
    }

    pub fn register_blocks(mut self, blocks: Vec<Block>) -> Self {
	for block in blocks {
	    self.blocks.push(block);
	}

	self
    }

    pub fn register_blocks_ref(&mut self, blocks: Vec<Block>) {
	for block in blocks {
	    self.blocks.push(block);
	}
    }
}

impl std::fmt::Display for Block {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {

	let result: std::fmt::Result = if !self.short.is_empty() {
            write!(f, "(short: {}, long: {})\n", self.short, self.long)
	} else {
	    write!(f, "block is a subblock.\n")
	};

	if !result.is_ok() {
	    return Err(std::fmt::Error);
	}

	for arg in &self.args {
	    let result: std::fmt::Result = write!(f, "    arg => (value: {}, required: {})\n", arg.value, arg.required);
	    if !result.is_ok() {
		return Err(std::fmt::Error);
	    }
	}

	Ok(())
    }
}
