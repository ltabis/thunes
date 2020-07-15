// use accountscli::utils;
use accountscli::args::setup;

fn main() {
    // utils::helpers::help();

    let args = setup::setup_args();

    for arg in &args.blocks {
	println!("block: {}", arg);
    }
}
