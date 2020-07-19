// record.rs
// Record where the data will be parsed

use serde_json;
use serde::{Serialize, Deserialize};
use std::fs::File;
use std::path::Path;
use std::io::prelude::*;
use std::io::{Error, ErrorKind};
use std::result::Result;
use crate::accounts::account;

const CONFIG_PATH: &str = "./config";
const DEFAULT_STORAGE_PATH: &str = "./records.json";
const DEFAULT_DB_CONFIG: &str = r#"
{
  "accounts": [],
  "record_path": "./records.json"
}"#;

// -- All records

#[derive(Serialize, Deserialize)]
pub struct Record {
    pub accounts: Vec<account::Account>,
    pub record_path: String,
}

// TODO: find a better way to handle errors.

impl Record {
    pub fn new() -> Result<Record, Error> {
	let record_path = Record::get_config();

	if record_path.is_err() {
	    return Err(record_path.err().unwrap());
	}

	return Record::get_data_base(&record_path.ok().unwrap());
    }

    fn get_data_base(record_path: &String) -> Result<Record, Error> {

	let mut record_content = String::new();

	if !Path::new(record_path).exists() {
	    record_content = DEFAULT_DB_CONFIG.to_string();
	} else {
	    let mut file = match File::open(record_path) {
		Ok(f) => f,
		Err(e) => return Err(e),
	    };

	    match file.read_to_string(&mut record_content) {
		Ok(_) => (),
		Err(e) => return Err(e),
	    };
	}

	match serde_json::from_str(&record_content) {
	    Ok(data) => Ok(data),
	    Err(_) => Err(Error::new(ErrorKind::InvalidData, "Couldn't parse record data.")),
	}
    }

    fn get_config() -> Result<String, Error> {
	let mut record_path = String::new();

	if !Path::new(CONFIG_PATH).exists() {
	    let mut file = match File::create(CONFIG_PATH) {
		Ok(f) => f,
		Err(e) => return Err(e),
	    };
	    match file.write_all(DEFAULT_STORAGE_PATH.as_bytes()) {
		Ok(()) => (),
		Err(e) => return Err(e),
	    };
	    record_path = DEFAULT_STORAGE_PATH.to_string();
	} else {
	    let mut file = match File::open(CONFIG_PATH) {
		Ok(f) => f,
		Err(e) => return Err(e),
	    };
	    match file.read_to_string(&mut record_path) {
		Ok(data) => data,
		Err(e) => return Err(e),
	    };
	}
	return Ok(record_path);
    }

    pub fn save_record(&self) -> Result<(), Error> {
	let mut file = match File::create(&self.record_path) {
	    Ok(f) => f,
	    Err(e) => return Err(e),
	};
	match file.write_all(serde_json::to_string(self).unwrap().as_bytes()) {
	    Ok(_) => Ok(()),
	    Err(e) => return Err(e),
	}
    }
}
