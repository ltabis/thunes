// error.rs
// error handling.

use std::io::Error;

pub fn err(msg: &Error) {
    eprintln!("Error: '{}'", msg);
}
