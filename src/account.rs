use std::io::{Read, Seek, Write};

use crate::transaction::Transaction;

#[derive(Debug)]
pub enum Error {
    Io(std::io::Error),
    Serde(serde_json::Error),
}

impl From<std::io::Error> for Error {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value)
    }
}

impl From<serde_json::Error> for Error {
    fn from(value: serde_json::Error) -> Self {
        Self::Serde(value)
    }
}

// NOTE: balance could be cached.
pub struct Account {
    name: String,
    file: std::fs::File,
    data: AccountData,
}

impl Account {
    /// Write a new empty account to a file.
    pub fn open(file: impl AsRef<std::path::Path>) -> Result<(), Error> {
        std::fs::File::create(file.as_ref())
            .and_then(|mut w| {
                w.write_all(
                    &serde_json::to_vec(&AccountData::default())
                        .expect("empty account must be deserialized"),
                )
            })
            .map_err(Error::Io)
    }

    pub fn from_file(file: impl AsRef<std::path::Path>) -> Result<Self, Error> {
        let name = file
            .as_ref()
            .file_stem()
            .map_or("unknown".to_string(), |stem| {
                stem.to_string_lossy().to_string()
            });
        let mut file = std::fs::OpenOptions::new()
            .read(true)
            .write(true)
            .append(false)
            .open(file.as_ref())?;

        // https://github.com/serde-rs/json/issues/160#issuecomment-253446892
        // Apparently one of the best current ways to deser a file.
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes)?;
        file.rewind()?;

        Ok(Self {
            name,
            file,
            data: serde_json::from_slice(&bytes).map_err(Error::Serde)?,
        })
    }

    /// Write account data to the file that the account was read from.
    pub fn write(&mut self) -> Result<&mut Self, Error> {
        self.file.write_all(&serde_json::to_vec(&self.data)?)?;

        Ok(self)
    }

    pub fn push_transaction(&mut self, transaction: Transaction) -> &mut Self {
        self.data.transactions.push(transaction);
        self
    }

    pub fn name(&self) -> &str {
        &self.name
    }

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
