// setup.rs
// setup configuration for all arguments.

use crate::args::arg;
use crate::new::account;
use crate::utils::helpers;

pub fn setup_args() -> arg::Block {
    let mut args = arg::Block::new("", "", None, true);

    args.register_blocks_ref(vec![
        arg::Block::new(
            "-h",
            "--help",
	    Some(helpers::display_help),
            true,
	),
        arg::Block::new(
            "-n",
            "--new",
	    Some(account::new_account),
            true,
        ).register_args(vec![
	    arg::Arg {
		value: String::new(),
		required: true
	    },
	]).register_blocks(vec![
            arg::Block::new(
		"",
		"",
		Some(account::new_account), // TODO: change by the righ function.
		false,
            ).register_args(vec![
		arg::Arg {
		    value: String::new(),
		    required: true
		},
		arg::Arg {
		    value: String::new(),
		    required: true
		}
	    ]).register_blocks(vec![
		arg::Block::new(
		    "",
		    "",
		    Some(account::new_account), // TODO: change by the righ function.
		    false,
		).register_args(vec![
		    arg::Arg {
			value: String::new(),
			required: true
		    },
		    arg::Arg {
			value: String::new(),
			required: true
		    }
		]),
	    ]),
	]),
    ]);

    args.register_args_ref(vec![
	arg::Arg {
	    value: String::new(),
	    required: true
	}
    ]);

    args
}
