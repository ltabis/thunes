use crate::transaction::Transaction;
use std::io::{Read, Seek, Write};

#[derive(Debug)]
pub enum Error {
    Io(std::io::Error),
    Serde(serde_json::Error),
    InvalidDateRange,
    AlreadyExists,
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
        // Truncate the file.
        self.file.set_len(0)?;
        self.file.rewind()?;

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

    pub fn transactions_between(
        &self,
        start: Option<&time::Date>,
        end: Option<&time::Date>,
    ) -> Result<&[Transaction], Error> {
        let start = match start {
            Some(start) => self.data.transactions.partition_point(|t| t.date() < start),
            None => 0,
        };

        let end = match end {
            Some(end) => self
                .data
                .transactions
                .iter()
                .rev()
                .position(|t| t.date() <= end)
                .map_or(0, |end| self.data.transactions.len() - end),
            None => self.data.transactions.len(),
        };

        if start == end && start == 0 {
            Ok(&[])
        } else if start < end {
            Ok(&self.data.transactions[start..end])
        } else {
            Err(Error::InvalidDateRange)
        }
    }
}

#[derive(Default, serde::Serialize, serde::Deserialize)]
struct AccountData {
    pub transactions: Vec<Transaction>,
}
