use crate::transaction::Transaction;
use std::io::{Read, Seek, Write};

#[derive(Debug)]
pub enum Error {
    Io(std::io::Error),
    Serde(serde_json::Error),
    InvalidDateRange,
    Exists,
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Error::Io(error) => error.to_string(),
                Error::Serde(error) => error.to_string(),
                Error::InvalidDateRange => "Invalid date range".to_string(),
                Error::Exists => "Account already exists".to_string(),
            }
        )
    }
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
    file: std::fs::File,
    pub data: Data,
}

impl Account {
    /// Write a new empty account to a file.
    pub fn new(
        path: impl AsRef<std::path::Path>,
        currency: impl AsRef<str>,
    ) -> Result<Self, Error> {
        let path = path.as_ref();

        if path.exists() {
            return Err(Error::Exists);
        }

        let name = path
            .file_stem()
            .map_or("unknown".into(), |stem| stem.to_string_lossy());

        std::fs::File::create(&path)
            .and_then(|mut w| {
                w.write_all(
                    &serde_json::to_vec(&Data::new(&name, currency.as_ref()))
                        .expect("empty account is deserializable"),
                )
            })
            .map_err(Error::Io)?;

        Self::open(path)
    }

    /// Open an account from a file.
    pub fn open(file: impl AsRef<std::path::Path>) -> Result<Self, Error> {
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
            file,
            data: serde_json::from_slice(&bytes).map_err(Error::Serde)?,
        })
    }

    pub fn name(&self) -> &str {
        &self.data.name
    }

    pub fn currency(&self) -> &str {
        &self.data.currency
    }

    pub fn write_transaction(&mut self, transaction: Transaction) -> Result<&mut Self, Error> {
        self.data.transactions.push(transaction);

        self.write()
    }

    pub fn write_transactions(
        &mut self,
        transactions: Vec<Transaction>,
    ) -> Result<&mut Self, Error> {
        self.data.transactions.extend(transactions);

        self.write()
    }

    pub fn balance(&self) -> Result<f64, Error> {
        self.transactions_between(None, None)
            .map(|ts| ts.iter().fold(0.0, |acc, t| acc + t.amount()))
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

    /// Write account data to the file that the account was read from.
    fn write(&mut self) -> Result<&mut Self, Error> {
        // Truncate the file.
        self.file.set_len(0)?;
        self.file.rewind()?;
        self.file.write_all(&serde_json::to_vec(&self.data)?)?;

        Ok(self)
    }
}

#[derive(ts_rs::TS)]
#[ts(export)]
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct Data {
    pub name: String,
    pub transactions: Vec<Transaction>,
    pub currency: String,
}

impl Data {
    pub fn new(name: &str, currency: &str) -> Self {
        Self {
            name: name.to_string(),
            transactions: vec![],
            currency: currency.to_string(),
        }
    }
}
