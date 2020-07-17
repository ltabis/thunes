use std::env;
use accountscli::utils;
use accountscli::args::setup;
use accountscli::args::dispatch;
use accountscli::accounts::record;

fn main() {
    let mut rd: record::Record = record::Record::new();
    
    let mut args = setup::setup_args();
    let index = dispatch::check_args(&args);
    if index == -1 {
    	eprintln!("Error: no argument recognized.");
    	utils::helpers::help();
    	std::process::exit(1);
    }

    let mut env_args = env::args();
    env_args.next(); // skip binary.
    env_args.next(); // skip option.
    dispatch::fill_command(&mut env_args, &mut args.blocks[index as usize]);
    dispatch::execute_blocks(&mut rd, &mut args.blocks[index as usize]);
    rd.save_record();
}
