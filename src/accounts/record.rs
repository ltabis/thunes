// record.rs
// Record where the data will be parsed

use serde_json;
use serde::{Serialize, Deserialize};
use std::fs::File;
use std::path::Path;
use std::io::prelude::*;
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

// TODO: Cleanup all the unwraps.

impl Record {
    pub fn new() -> Record {
	let record_path = Record::get_config();

	return Record::get_data_base(&record_path);
    }

    fn get_data_base(record_path: &String) -> Record {

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

    pub fn save_record(&self) {
	let mut file = File::create(&self.record_path).unwrap();
	file.write_all(serde_json::to_string(self).unwrap().as_bytes()).unwrap();
    }
}
