mod account;
mod charts;
mod script;
mod transaction;

use account::Account;
use clap::Subcommand;
use transaction::{Item, Transaction};

use crate::transaction::TransactionRhai;

const TIME_FORMAT: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]-[month]-[day]");

// TODO: thiserror
#[derive(Debug)]
pub enum Error {
    Account(String, account::Error),
    Operation(transaction::Error),
    InvalidDate(time::error::Parse),
    ScriptEvaluation(Box<rhai::EvalAltResult>),
}

impl From<transaction::Error> for Error {
    fn from(value: transaction::Error) -> Self {
        Self::Operation(value)
    }
}

#[derive(Clone, serde::Deserialize)]
pub struct ScriptAccountBalance {
    pub amount: rhai::FLOAT,
    pub currency: String,
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
        from: Option<time::Date>,
        /// Sums balances to this date.
        #[arg(short, long, value_name = "END-DATE", value_parser = Commands::parse_date)]
        to: Option<time::Date>,
        /// Write the transactions to a svg chart.
        #[arg(short, long)]
        chart: bool,
        /// Use a rhai script to format the output.
        #[arg(short, long)]
        script: Option<std::path::PathBuf>,
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

    pub fn run(self, accounts_path: &str) -> Result<(), Error> {
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
                from,
                to,
                chart,
                script,
            } => Commands::balance(
                accounts_path,
                account.as_ref(),
                from.as_ref(),
                to.as_ref(),
                chart,
                script.as_ref(),
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

    fn new_account(accounts_path: &str, name: &str, currency: &str) -> Result<(), Error> {
        let path = std::path::PathBuf::from_iter([accounts_path, name]);

        if path.exists() {
            return Err(Error::Account(
                name.to_string(),
                account::Error::AlreadyExists,
            ));
        }

        Account::open(path, currency).map_err(|error| Error::Account(name.to_string(), error))
    }

    fn write_transaction(
        accounts_path: &str,
        name: &str,
        transaction: Transaction,
    ) -> Result<(), Error> {
        Account::from_file(std::path::PathBuf::from_iter([accounts_path, name]))
            .map_err(|error| Error::Account(name.to_string(), error))?
            .push_transaction(transaction)
            .write()
            .map_err(|error| Error::Account(name.to_string(), error))
            .map(|_| ())
    }

    fn balance(
        accounts_path: &str,
        account: Option<&String>,
        from: Option<&time::Date>,
        to: Option<&time::Date>,
        chart: bool,
        script: Option<&std::path::PathBuf>,
    ) -> Result<(), Error> {
        let totals = if let Some(script) = script {
            let engine = script::build_engine();
            let accounts = Self::get_accounts(accounts_path, account);
            let ast = engine
                .compile_file(script.into())
                .map_err(Error::ScriptEvaluation)?;
            let mut totals = std::collections::HashMap::<String, f64>::new();

            for account in accounts {
                let fn_name = format!("on_{}", account.name());
                if ast
                    .iter_functions()
                    .find(|func| func.name == fn_name)
                    .is_some()
                {
                    let transactions = account
                        .transactions_between(from, to)
                        .map_err(|error| Error::Account(account.name().to_string(), error))?;

                    let parameters = transactions
                        .iter()
                        .map(|t| rhai::serde::to_dynamic(TransactionRhai::from(t)).unwrap())
                        .collect::<rhai::Array>();

                    let parameters =
                        rhai::serde::to_dynamic(parameters).map_err(Error::ScriptEvaluation)?;

                    let account_balance = engine
                        .call_fn::<rhai::Dynamic>(
                            &mut rhai::Scope::new(),
                            &ast,
                            fn_name,
                            (parameters,),
                        )
                        .map_err(Error::ScriptEvaluation)?;

                    let balance = if account_balance.is_map() {
                        let balance: ScriptAccountBalance =
                            rhai::serde::from_dynamic(&account_balance)
                                .map_err(Error::ScriptEvaluation)?;

                        totals
                            .entry(balance.currency)
                            .and_modify(|entry| *entry += balance.amount)
                            .or_insert(balance.amount);

                        balance.amount
                    } else if account_balance.is_float() {
                        let balance = account_balance.cast::<rhai::FLOAT>();
                        totals
                            .entry(account.currency().to_string())
                            .and_modify(|entry| *entry += balance)
                            .or_insert(balance);
                        balance
                    } else {
                        // FIXME: better error.
                        return Err(Error::ScriptEvaluation(Box::new(
                            rhai::EvalAltResult::ErrorRuntime(
                                rhai::Dynamic::from("return value must be a map or float"),
                                rhai::Position::NONE,
                            ),
                        )));
                    };

                    match (transactions.first(), transactions.last()) {
                        (Some(from), Some(to)) => {
                            println!(
                                "[{}/{}] balance for '{}': {:.2} {}",
                                from.date(),
                                to.date(),
                                account.name(),
                                balance,
                                account.currency()
                            );

                            if chart {
                                charts::build(transactions);
                            }
                        }
                        _ => {
                            println!(
                                "balance for '{}': 0.00 {}",
                                account.name(),
                                account.currency()
                            );
                        }
                    }
                } else {
                    let account_balance = Self::list_between(&account, from, to, chart)?;

                    totals
                        .entry(account.currency().to_string())
                        .and_modify(|entry| *entry += account_balance)
                        .or_insert(account_balance);
                }
            }

            totals
        } else {
            let mut totals = std::collections::HashMap::<String, f64>::new();

            let accounts = Self::get_accounts(accounts_path, account);

            for account in accounts {
                let account_balance = Self::list_between(&account, from, to, chart)?;

                totals
                    .entry(account.currency().to_string())
                    .and_modify(|entry| *entry += account_balance)
                    .or_insert(account_balance);
            }

            totals
        };

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

    fn get_accounts(accounts_path: &str, account: Option<&String>) -> Vec<Account> {
        if let Some(account) = account {
            match Account::from_file(std::path::PathBuf::from_iter([accounts_path, account])) {
                Ok(account) => vec![account],
                Err(error) => {
                    println!("failed to open {account:?}: {error:?}");
                    vec![]
                }
            }
        } else {
            Self::list_accounts_paths(accounts_path)
                .into_iter()
                .filter_map(|path| match Account::from_file(&path) {
                    Ok(account) => Some(account),
                    Err(error) => {
                        println!("failed to open {path:?}: {error:?}");
                        None
                    }
                })
                .collect::<Vec<_>>()
        }
    }

    fn list_between(
        account: &Account,
        from: Option<&time::Date>,
        to: Option<&time::Date>,
        chart: bool,
    ) -> Result<f64, Error> {
        let transactions = account
            .transactions_between(from, to)
            .map_err(|error| Error::Account(account.name().to_string(), error))?;

        match (transactions.first(), transactions.last()) {
            (Some(from), Some(to)) => {
                let balance: f64 = transactions.iter().map(|op| op.amount()).sum();

                println!(
                    "[{}/{}] balance for '{}': {:.2} {}",
                    from.date(),
                    to.date(),
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
