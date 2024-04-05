use std::io::{Read, Write};

use crate::transaction::Transaction;

// NOTE: balance could be cached.
pub struct Account {
    name: String,
    file: std::fs::File,
    data: AccountData,
}

impl Account {
    /// Write a new empty account to a file.
    pub fn open(file: impl AsRef<std::path::Path>) -> Result<(), ()> {
        std::fs::File::create(file.as_ref())
            .and_then(|mut w| {
                w.write_all(
                    &serde_json::to_vec(&AccountData::default())
                        .expect("empty account can be deserialized"),
                )
            })
            .unwrap();

        Ok(())
    }

    /// Open an account from a file.
    pub fn from_file(file: impl AsRef<std::path::Path>) -> Result<Self, ()> {
        let name = file
            .as_ref()
            .file_stem()
            .unwrap()
            .to_string_lossy()
            .to_string();
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .open(file.as_ref())
            .unwrap();

        // https://github.com/serde-rs/json/issues/160#issuecomment-253446892
        // Apparently one of the best current ways to deser a file.
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes).unwrap();

        Ok(Self {
            name,
            file,
            data: serde_json::from_slice(&bytes).unwrap(),
        })
    }

    /// Write account data to the file that the account was read from.
    pub fn write(&mut self) -> Result<&mut Self, ()> {
        self.file
            .write_all(&serde_json::to_vec(&self.data).unwrap())
            .unwrap();

        Ok(self)
    }

    pub fn push_transaction(&mut self, transaction: Transaction) -> &mut Self {
        self.data.transactions.push(transaction);
        self
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    /// Get the balance of the account.
    pub fn balance(&self) -> f64 {
        let mut balance = 0.0;

        for tr in &self.data.transactions {
            match tr {
                Transaction::Income(i) => balance += i.ammount,
                Transaction::Spending(i) => balance -= i.ammount,
            }
        }

        balance
    }
}

#[derive(Default, serde::Serialize, serde::Deserialize)]
struct AccountData {
    pub transactions: Vec<Transaction>,
}
