use accountscli::utils;
use accountscli::args::setup;
use accountscli::args::dispatch;

fn main() {
    // utils::helpers::help();

    let args = setup::setup_args();
    if !dispatch::dispatch_args(&args) {
	eprintln!("Error: no argument recognized.");
	utils::helpers::help();
	std::process::exit(1);
    }

    std::process::exit(0);
}

// for arg in &args.blocks {
// 	println!("block: {}", arg);
// }
