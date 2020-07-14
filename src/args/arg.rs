// arg.rs
// A configurable argument struct.

use std::vec::Vec;

pub struct Arg {
    pub value: String,
    pub required: bool,
}

pub struct Block {
    pub short: String,
    pub long: String,
    pub args: Vec<Arg>,
    pub blocks: Vec<Block>,
    pub required: bool,
}

impl Block {
    pub fn new(short: &str, long: &str, required: bool) -> Block {
	Block {
	    short: String::from(&short[..]),
	    long: String::from(&long[..]),
	    args: Vec::new(),
	    blocks: Vec::new(),
	    required
	}
    }

    pub fn register_args(&mut self, args: Vec<Arg>) {
	for arg in args {
	    self.args.push(arg);
	}
    }

    pub fn register_blocks(&mut self, blocks: Vec<Block>) {
	for block in blocks {
	    self.blocks.push(block);
	}
    }
}

impl std::fmt::Display for Block {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "(short: {}, long: {}, required: {})", self.short, self.long, self.required)
    }
}
