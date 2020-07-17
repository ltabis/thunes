// setup.rs
// setup configuration for all arguments.

use crate::args::arg;
use crate::new::account;
use crate::utils::helpers;

pub fn setup_args() -> arg::Block {
    let mut args = arg::Block::new("", "", None);

    args.register_blocks_ref(vec![
        arg::Block::new(
            "-h",
            "--help",
	    Some(helpers::display_help),
	),
        arg::Block::new(
            "-n",
            "--new",
	    Some(account::new_item),
        ).register_args(vec![
	    arg::Arg {
		label: "account".to_string(),
		value: String::new(),
		required: true // TODO: make this count.
	    },
	    arg::Arg {
		label: "label".to_string(),
		value: String::new(),
		required: false
	    },
	    arg::Arg {
		label: "amount".to_string(),
		value: String::new(),
		required: false
	    },
	    arg::Arg {
		label: "date".to_string(),
		value: String::new(),
		required: false
	    },
	    arg::Arg {
		label: "note".to_string(),
		value: String::new(),
		required: false
	    }
	]),
    ]);

    // args.register_args_ref(vec![
    // 	arg::Arg {
    // 	    label: "account".to_string(),
    // 	    value: String::new(),
    // 	    required: true
    // 	}
    // ]);

    args
}
