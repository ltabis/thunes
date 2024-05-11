mod account;
mod charts;
mod transaction;

use account::Account;
use clap::Subcommand;
use transaction::{Item, Transaction};

const TIME_FORMAT: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]-[month]-[day]");

// TODO: thiserror
#[derive(Debug)]
pub enum CommandError {
    Account(String, account::Error),
    Operation(transaction::Error),
    InvalidDate(time::error::Parse),
}

impl From<transaction::Error> for CommandError {
    fn from(value: transaction::Error) -> Self {
        Self::Operation(value)
    }
}
#[derive(Subcommand)]
pub enum Commands {
    /// Create a new account. Fails if the account already exists.
    New {
        /// Name of the new account.
        #[arg(short, long)]
        name: String,
        /// Name of the new account.
        #[arg(short, long)]
        currency: String,
    },
    /// Add a spending transaction.
    Spend {
        /// The account to add the transaction to.
        #[arg(long, value_name = "ACCOUNT-NAME")]
        account: String,
        /// amount of currency associated to the transaction.
        #[arg(long, value_name = "amount")]
        amount: f64,
        /// Description of the transaction.
        #[arg(short, long, value_name = "DESCRIPTION")]
        description: String,
        /// Tags to classify the transaction.
        /// Example: --tags=house,family,expenses
        #[arg(short, long, value_name = "TAGS", value_parser = Commands::parse_tags)]
        tags: std::collections::HashSet<String>,
    },
    /// Add an income transaction.
    Income {
        /// The account to add the transaction to.
        #[arg(long, value_name = "ACCOUNT-NAME")]
        account: String,
        /// amount of currency associated to the transaction.
        #[arg(long, value_name = "amount")]
        amount: f64,
        /// Description of the transaction.
        #[arg(short, long, value_name = "DESCRIPTION")]
        description: String,
        /// Tags to classify the transaction.
        /// Example: --tags=house,family,expenses
        #[arg(short, long, value_name = "TAGS", value_parser = Commands::parse_tags)]
        tags: std::collections::HashSet<String>,
    },
    /// Display the total balance of accounts.
    Balance {
        /// Name of the account to display the balance from. If not specified, will agregate all
        /// balances from the accounts in the `--accounts` directory.
        #[arg(short, long, value_name = "ACCOUNT-NAME")]
        account: Option<String>,
        /// Sums balances starting from this date.
        #[arg(short, long, value_name = "START-DATE", value_parser = Commands::parse_date)]
        start: Option<time::Date>,
        /// Sums balances to this date.
        #[arg(short, long, value_name = "END-DATE", value_parser = Commands::parse_date)]
        end: Option<time::Date>,
        /// Write the transactions to a svg chart.
        #[arg(short, long)]
        chart: bool,
    },
    // cli operations/o [bourso] [month] -> 1800 EUR
}

impl Commands {
    fn parse_tags(
        s: &str,
    ) -> Result<std::collections::HashSet<String>, Box<dyn std::error::Error + Send + Sync + 'static>>
    {
        Ok(s.split(',').map(|s| s.to_string()).collect())
    }

    fn parse_date(
        s: &str,
    ) -> Result<time::Date, Box<dyn std::error::Error + Send + Sync + 'static>> {
        time::Date::parse(s, TIME_FORMAT).map_err(|error| error.into())
    }

    pub fn run(self, accounts_path: &str) -> Result<(), CommandError> {
        match self {
            Commands::New { name, currency } => {
                Commands::new_account(accounts_path, &name, &currency)
            }
            Commands::Income {
                account,
                amount,
                description,
                tags,
            } => Commands::write_transaction(
                accounts_path,
                &account,
                Transaction::Income(Item {
                    date: time::OffsetDateTime::now_utc().date(),
                    amount,
                    description: description.to_string(),
                    tags: tags.clone(),
                }),
            ),
            Commands::Spend {
                account,
                amount,
                description,
                tags,
            } => Commands::write_transaction(
                accounts_path,
                &account,
                Transaction::Spending(Item {
                    date: time::OffsetDateTime::now_utc().date(),
                    amount,
                    description,
                    tags,
                }),
            ),
            Commands::Balance {
                account,
                start,
                end,
                chart,
            } => Commands::balance(
                accounts_path,
                account.as_ref(),
                start.as_ref(),
                end.as_ref(),
                chart,
            ),
        }
    }

    fn list_accounts_paths(accounts_path: &str) -> Vec<std::path::PathBuf> {
        std::fs::read_dir(accounts_path)
            .map(|dir| {
                dir.filter_map(|entry| {
                    let account = entry.expect("entry must be valid").path();
                    if account.is_file() {
                        Some(account)
                    } else {
                        None
                    }
                })
                .collect()
            })
            .unwrap_or_default()
    }

    fn new_account(accounts_path: &str, name: &str, currency: &str) -> Result<(), CommandError> {
        let path = std::path::PathBuf::from_iter([accounts_path, name]);

        if path.exists() {
            return Err(CommandError::Account(
                name.to_string(),
                account::Error::AlreadyExists,
            ));
        }

        Account::open(path, currency)
            .map_err(|error| CommandError::Account(name.to_string(), error))
    }

    fn write_transaction(
        accounts_path: &str,
        name: &str,
        transaction: Transaction,
    ) -> Result<(), CommandError> {
        Account::from_file(std::path::PathBuf::from_iter([accounts_path, name]))
            .map_err(|error| CommandError::Account(name.to_string(), error))?
            .push_transaction(transaction)
            .write()
            .map_err(|error| CommandError::Account(name.to_string(), error))
            .map(|_| ())
    }

    fn balance(
        accounts_path: &str,
        account: Option<&String>,
        start: Option<&time::Date>,
        end: Option<&time::Date>,
        chart: bool,
    ) -> Result<(), CommandError> {
        if let Some(account) = account {
            let account =
                Account::from_file(std::path::PathBuf::from_iter([accounts_path, account]))
                    .map_err(|error| CommandError::Account(account.to_string(), error))?;

            Self::list_between(&account, start, end, chart).map(|_| ())
        } else {
            let mut totals = std::collections::HashMap::<String, f64>::new();

            for path in Self::list_accounts_paths(accounts_path) {
                match Account::from_file(std::path::PathBuf::from_iter([
                    accounts_path,
                    &path.to_string_lossy(),
                ])) {
                    Ok(account) => {
                        let account_balance = Self::list_between(&account, start, end, chart)?;

                        totals
                            .entry(account.currency().to_string())
                            .and_modify(|entry| *entry += account_balance)
                            .or_insert(account_balance);
                    }
                    Err(error) => {
                        println!("failed to open {path:?}: {error:?}");
                    }
                }
            }

            let mut totals: Vec<(String, f64)> = totals
                .into_iter()
                .map(|(currency, total)| (currency.to_string(), total))
                .collect();
            totals.sort_by(|(c1, _), (c2, _)| c1.cmp(c2));

            println!("\nTotals:");

            for (currency, total) in totals {
                println!("  {total:.2} {currency}");
            }

            Ok(())
        }
    }

    fn list_between(
        account: &Account,
        start: Option<&time::Date>,
        end: Option<&time::Date>,
        chart: bool,
    ) -> Result<f64, CommandError> {
        let transactions = account
            .transactions_between(start, end)
            .map_err(|error| CommandError::Account(account.name().to_string(), error))?;

        match (transactions.first(), transactions.last()) {
            (Some(start), Some(end)) => {
                let balance: f64 = transactions.iter().map(|op| op.amount()).sum();

                println!(
                    "[{}/{}] balance for '{}': {:.2} {}",
                    start.date(),
                    end.date(),
                    account.name(),
                    balance,
                    account.currency()
                );

                if chart {
                    charts::build(transactions);
                }

                Ok(balance)
            }
            _ => {
                println!(
                    "balance for '{}': 0.00 {}",
                    account.name(),
                    account.currency()
                );
                Ok(0.0)
            }
        }
    }
}
