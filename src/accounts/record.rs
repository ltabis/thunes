// record.rs
// Record where the data will be parsed

use std::fs::File;
use std::io::prelude::*;
use std::path::Path;
use crate::accounts::account;
use serde_json;
use serde_json::{Value};

const CONFIG_PATH: &str = "./config";
const DEFAULT_STORAGE_PATH: &str = "./records.json";
const DEFAULT_DB_CONFIG: &str = r#"
{
    "name": "John Doe",
    "age": 43,
    "phones": [
       "+44 1234567",
       "+44 2345678"
    ]
}"#;

// -- All records

pub struct Record {
    pub accounts: Vec<account::Account>,
}

// TODO: Cleanup all the unwraps.

impl Record {
    pub fn new() -> Record {
	let record_path = Record::get_config();
	let v = Record::get_data_base(&record_path);
	println!("value: {}", v);

	Record {
	    accounts: vec![]
	}
    }

    fn get_data_base(record_path: &String) -> Value {

	let mut record_content = String::new();

	if !Path::new(record_path).exists() {
	    record_content = DEFAULT_DB_CONFIG.to_string();
	} else {
	    let mut file = File::open(record_path).unwrap();

	    file.read_to_string(&mut record_content).unwrap();
	}

	return serde_json::from_str(&record_content).unwrap();
    }

    fn get_config() -> String {
	let mut record_path = String::new();

	if !Path::new(CONFIG_PATH).exists() {
	    let mut file = File::create(CONFIG_PATH).unwrap();
	    file.write_all(DEFAULT_STORAGE_PATH.as_bytes()).unwrap();
	    record_path = DEFAULT_STORAGE_PATH.to_string();
	} else {
	    let mut file = File::open(CONFIG_PATH).unwrap();
	    file.read_to_string(&mut record_path).unwrap();
	}
	return record_path;
    }
}
