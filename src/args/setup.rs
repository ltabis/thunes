// setup.rs
// setup configuration for all arguments.

use crate::args::arg;
use crate::new;
use crate::utils::helpers;
use crate::list;

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
	    Some(new::items::new_item),
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
	arg::Block::new(
            "-l",
            "--list",
	    Some(list::items::list_items),
        ).register_args(vec![
	    arg::Arg {
		label: "account".to_string(),
		value: String::new(),
		required: false
	    },
	]),
    ]);

    args
}
