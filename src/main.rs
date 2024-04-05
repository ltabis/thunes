mod account;
mod charts;
mod transaction;

use account::Account;
use transaction::{Item, Transaction};

use clap::{Parser, Subcommand};

#[derive(Debug)]
pub enum CommandError {
    CreateAccount(String, std::io::Error),
    OpenAccount(String, std::io::Error),
    WriteToAccount(String, transaction::Error),
    Operation(transaction::Error),
}

impl From<transaction::Error> for CommandError {
    fn from(value: transaction::Error) -> Self {
        Self::Operation(value)
    }
}

/// Program to record and analyze financial data.
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    /// Path to the account files. If not specified, the program will search the current directory.
    #[arg(short, long)]
    accounts: Option<String>,
    /// Command to execute on the files.
    #[command(subcommand)]
    command: Commands,
}

impl Cli {
    fn execute(self) -> Result<(), CommandError> {
        let accounts_path = self.accounts.unwrap_or(".".to_string());
        let accounts_path = &accounts_path;

        match self.command {
            Commands::New { name } => Commands::new_account(accounts_path, &name),
            Commands::Income {
                account,
                ammount,
                description,
                tags,
            } => Commands::write_transaction(
                accounts_path,
                &account,
                Transaction::Income(Item {
                    date: time::OffsetDateTime::now_utc().date(),
                    ammount: ammount,
                    description: description.to_string(),
                    tags: tags.clone(),
                }),
            ),
            Commands::Spend {
                account,
                ammount,
                description,
                tags,
            } => Commands::write_transaction(
                accounts_path,
                &account,
                Transaction::Spending(Item {
                    date: time::OffsetDateTime::now_utc().date(),
                    ammount: ammount,
                    description: description,
                    tags,
                }),
            ),
            Commands::Balance { account } => Commands::balance(accounts_path, account.as_ref()),
            Commands::List {
                account: _account,
                start: _start,
                end: _end,
                chart: _chart,
            } => {
                // let start = time::Date::parse(&start, TIME_FORMAT)
                //     .map_err(|_| "[start] argument must be a date")
                //     .unwrap();
                // let end = time::Date::parse(&end, TIME_FORMAT)
                //     .map_err(|_| "[end] argument must be a date")
                //     .unwrap();

                // enum Parser {
                //     SearchStart,
                //     ComputeBalance,
                //     End,
                // }

                // let mut parser = Parser::SearchStart;
                // let mut operations = vec![];

                // for line in
                //     std::fs::read_to_string(std::path::PathBuf::from_iter([accounts_path, &name]))
                //         .unwrap()
                //         .lines()
                // {
                //     match parser {
                //         Parser::SearchStart => {
                //             let op = Operation::from_str(line).unwrap();
                //             if op.date() == start {
                //                 operations.push(op);
                //                 parser = Parser::ComputeBalance;
                //             }
                //         }
                //         Parser::ComputeBalance => {
                //             let op = Operation::from_str(line).unwrap();
                //             if op.date() == end {
                //                 parser = Parser::End;
                //             }
                //             operations.push(op);
                //         }
                //         Parser::End => {
                //             break;
                //         }
                //     }
                // }

                // let balance: f64 = operations.iter().map(|op| op.ammount()).sum();
                // println!("balance between {start} and {end}: {balance:.2} EUR");

                // if chart {
                //     build_chart(&operations);
                // }

                Ok(())
            }
            Commands::Accounts => {
                Commands::accounts(accounts_path);
                Ok(())
            }
        }
    }
}

#[derive(Subcommand)]
enum Commands {
    /// Create a new account.
    New {
        #[arg(short, long)]
        name: String,
    },
    /// Add a spending operation.
    Spend {
        #[arg(long, value_name = "ACCOUNT-NAME")]
        account: String,
        #[arg(long, value_name = "AMMOUNT")]
        ammount: f64,
        #[arg(short, long, value_name = "DESCRIPTION")]
        description: String,
        /// Tags to classify transactions.
        /// Example: --tags=house,family,expenses
        #[arg(short, long, value_name = "TAGS", value_parser = Commands::parse_tags)]
        tags: std::collections::HashSet<String>,
    },
    /// Add an income operation.
    Income {
        #[arg(long, value_name = "ACCOUNT-NAME")]
        account: String,
        #[arg(long, value_name = "AMMOUNT")]
        ammount: f64,
        #[arg(short, long, value_name = "DESCRIPTION")]
        description: String,
        /// Tags to classify transactions.
        /// Example: --tags=house,family,expenses
        #[arg(short, long, value_name = "TAGS", value_parser = Commands::parse_tags)]
        tags: std::collections::HashSet<String>,
    },
    /// Display the balance of a specific account or all accounts if the --name option is not specified.
    Balance {
        #[arg(short, long, value_name = "ACCOUNT-NAME")]
        account: Option<String>,
    },
    /// List the transaction ammount between two dates.
    List {
        // TODO: set optional.
        #[arg(short, long, value_name = "ACCOUNT-NAME")]
        account: String,
        #[arg(short, long, value_name = "START-DATE")]
        start: String,
        #[arg(short, long, value_name = "END-DATE")]
        end: String,
        #[arg(short, long)]
        chart: bool,
    },
    /// Display all accounts names.
    Accounts,
    // cli operations/o [bourso] [month] -> 1800 EUR
}

impl Commands {
    fn parse_tags(
        s: &str,
    ) -> Result<std::collections::HashSet<String>, Box<dyn std::error::Error + Send + Sync + 'static>>
    {
        Ok(s.split(',').map(|s| s.to_string()).collect())
    }

    fn list_accounts_paths(accounts_path: &str) -> Vec<std::path::PathBuf> {
        std::fs::read_dir(accounts_path)
            .expect("database must be a directory")
            .filter_map(|entry| {
                let account = entry.expect("entry must be valid").path();
                if account.is_file() {
                    Some(account)
                } else {
                    None
                }
            })
            .collect()
    }

    fn new_account(accounts_path: &str, name: &str) -> Result<(), CommandError> {
        // TODO: check if the account does not already exists.
        Account::open(std::path::PathBuf::from_iter([accounts_path, &name])).unwrap();

        Ok(())
    }

    fn write_transaction(
        accounts_path: &str,
        name: &str,
        transaction: Transaction,
    ) -> Result<(), CommandError> {
        let mut account =
            Account::from_file(std::path::PathBuf::from_iter([accounts_path, name])).unwrap();

        account.push_transaction(transaction).write().unwrap();

        Ok(())
    }

    fn balance(accounts_path: &str, name: Option<&String>) -> Result<(), CommandError> {
        if let Some(account) = name {
            let account =
                Account::from_file(std::path::PathBuf::from_iter([accounts_path, account]))
                    .unwrap();

            println!(
                "Balance for '{}': {:.2} EUR",
                account.name(),
                account.balance()
            );
        } else {
            let mut total = 0.0;

            for path in Self::list_accounts_paths(accounts_path) {
                let account = Account::from_file(std::path::PathBuf::from_iter([
                    accounts_path,
                    &path.to_string_lossy(),
                ]))
                .unwrap();

                let balance = account.balance();
                println!("{}: {:.2} EUR", account.name(), balance);
                total += balance;
            }

            println!("\nTotal: {total:.2} EUR");
        }

        Ok(())
    }

    fn accounts(accounts_path: &str) {
        for account in Self::list_accounts_paths(accounts_path) {
            if let Some(name) = account.file_name().and_then(|name| name.to_str()) {
                println!("{}", name)
            }
        }
    }
}

fn main() -> Result<(), CommandError> {
    let cli = Cli::parse();
    cli.execute()
}
