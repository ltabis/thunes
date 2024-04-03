mod charts;
mod operations;

use operations::{Item, Operation};

use clap::{Parser, Subcommand};
use std::{io::Write, str::FromStr};

#[derive(Debug)]
pub enum CommandError {
    CreateAccount(String, std::io::Error),
    OpenAccount(String, std::io::Error),
    WriteToAccount(String, std::io::Error),
    Operation(operations::Error),
}

impl From<operations::Error> for CommandError {
    fn from(value: operations::Error) -> Self {
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
        let account_path = self.accounts.unwrap_or(".".to_string());
        let account_path = &account_path;

        match self.command {
            Commands::New { name } => Commands::new_account(account_path, &name),
            Commands::Income {
                account,
                ammount,
                description,
                tags,
            } => Commands::write_operation(
                account_path,
                &account,
                Operation::Income(Item {
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
            } => Commands::write_operation(
                account_path,
                &account,
                Operation::Spending(Item {
                    date: time::OffsetDateTime::now_utc().date(),
                    ammount: ammount,
                    description: description,
                    tags,
                }),
            ),
            Commands::Balance { account } => Commands::balance(account_path, account.as_ref()),
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
                //     std::fs::read_to_string(std::path::PathBuf::from_iter([account_path, &name]))
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
                Commands::accounts(account_path);
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
        #[arg(short, long, value_name = "ACCOUNT-NAME")]
        account: String,
        #[arg(short, long, value_name = "AMMOUNT")]
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
        #[arg(short, long, value_name = "ACCOUNT-NAME")]
        account: String,
        #[arg(short, long, value_name = "AMMOUNT")]
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

    fn list_accounts_paths(account_path: &str) -> Vec<std::path::PathBuf> {
        std::fs::read_dir(account_path)
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

    fn new_account(account_path: &str, name: &str) -> Result<(), CommandError> {
        std::fs::File::create(std::path::PathBuf::from_iter([account_path, &name])).map_or_else(
            |error| Err(CommandError::CreateAccount(name.to_string(), error)),
            |_| Ok(()),
        )
    }

    fn write_operation(
        account_path: &str,
        name: &str,
        operation: Operation,
    ) -> Result<(), CommandError> {
        let mut f = std::fs::OpenOptions::new()
            .append(true)
            .open(std::path::PathBuf::from_iter([account_path, name]))
            .map_err(|error| CommandError::OpenAccount(name.to_string(), error))?;

        f.write_all(operation.to_string().as_bytes())
            .map_err(|error| CommandError::WriteToAccount(name.to_string(), error))
    }

    fn balance(account_path: &str, name: Option<&String>) -> Result<(), CommandError> {
        fn get_account_balance(account_path: &str, name: &str) -> Result<f64, CommandError> {
            let mut balance = 0.0;

            for line in std::fs::read_to_string(std::path::PathBuf::from_iter([account_path, name]))
                .map_err(|error| CommandError::OpenAccount(name.to_string(), error))?
                .lines()
            {
                match Operation::from_str(line)? {
                    Operation::Income(i) => balance += i.ammount,
                    Operation::Spending(i) => balance -= i.ammount,
                }
            }

            Ok(balance)
        }

        if let Some(account) = name {
            println!(
                "Balance for '{account}': {:.2} EUR",
                get_account_balance(account_path, &account)?
            );
        } else {
            let mut total = 0.0;
            for account in Self::list_accounts_paths(account_path) {
                if let Some(name) = account.file_name().and_then(|name| name.to_str()) {
                    let balance = get_account_balance(account_path, &account.to_string_lossy())?;
                    println!("{name}: {balance:.2} EUR",);
                    total += balance;
                }
            }
            println!("\nTotal: {total:.2} EUR",);
        }

        Ok(())
    }

    fn accounts(account_path: &str) {
        for account in Self::list_accounts_paths(account_path) {
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
