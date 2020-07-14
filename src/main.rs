// use accountscli::utils;
use accountscli::args::arg;

fn main() {
    // utils::helpers::help();

    let mut args = arg::Block::new("", "", true);

    args.register_blocks(vec![
	arg::Block::new(
	    "-n",
	    "--new",
	    true,
	)
    ]);

    println!("block1: {}", args.blocks[0]);
}
