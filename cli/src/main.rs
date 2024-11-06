use clap::Parser;
use clap::Subcommand;
use tunes_cli::account;
use tunes_cli::account::Account;
use tunes_cli::script;
use tunes_cli::script::ScriptAccountBalance;
use tunes_cli::transaction;
use tunes_cli::transaction::Item;
use tunes_cli::transaction::Transaction;
use tunes_cli::transaction::TransactionRhai;
use tunes_cli::TIME_FORMAT;

#[derive(Debug)]
pub enum Error {
    Account(account::Error),
    Operation(transaction::Error),
    InvalidDate(time::error::Parse),
    ScriptEvaluation(Box<rhai::EvalAltResult>),
}

impl From<transaction::Error> for Error {
    fn from(value: transaction::Error) -> Self {
        Self::Operation(value)
    }
}

impl From<account::Error> for Error {
    fn from(value: account::Error) -> Self {
        Self::Account(value)
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
        /// Name of the account to display the balance from. If not specified, will aggregate all
        /// balances from the accounts in the `--accounts` directory.
        #[arg(short, long, value_name = "ACCOUNT-NAME")]
        account: Option<String>,
        /// Sums balances starting from this date.
        #[arg(short, long, value_name = "START-DATE", value_parser = Commands::parse_date)]
        from: Option<time::Date>,
        /// Sums balances to this date.
        #[arg(short, long, value_name = "END-DATE", value_parser = Commands::parse_date)]
        to: Option<time::Date>,
        /// Use a rhai script to format the output.
        #[arg(short, long)]
        script: Option<std::path::PathBuf>,
    },
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
                script,
            } => Commands::balance(
                accounts_path,
                account.as_ref(),
                from.as_ref(),
                to.as_ref(),
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

        Account::new(path, currency)
            .map_err(|error| Error::Account(error))
            .map(|_| ())
    }

    fn write_transaction(
        accounts_path: &str,
        name: &str,
        transaction: Transaction,
    ) -> Result<(), Error> {
        let path = std::path::PathBuf::from_iter([accounts_path, name]);

        Account::open(path)?.write_transaction(transaction)?;
        Ok(())
    }

    fn balance(
        accounts_path: &str,
        account: Option<&String>,
        from: Option<&time::Date>,
        to: Option<&time::Date>,
        script: Option<&std::path::PathBuf>,
    ) -> Result<(), Error> {
        let totals = if let Some(script) = script {
            let engine = script::build_engine(script);
            let accounts = Self::get_accounts(accounts_path, account);

            let ast = engine
                .compile_file(script.into())
                .map_err(Error::ScriptEvaluation)?;
            let mut totals = std::collections::HashMap::<String, f64>::new();

            for account in accounts {
                let fn_name = format!("on_{}", account.name());
                if ast.iter_functions().any(|func| func.name == fn_name) {
                    let transactions = account
                        .transactions_between(from, to)
                        .map_err(|error| Error::Account(error))?;

                    let parameters: rhai::Dynamic = transactions
                        .iter()
                        .map(TransactionRhai::from)
                        .collect::<Vec<TransactionRhai>>()
                        .into();

                    let account_balance = engine
                        .call_fn::<rhai::Dynamic>(
                            &mut rhai::Scope::new(),
                            &ast,
                            fn_name,
                            (parameters,),
                        )
                        .map_err(Error::ScriptEvaluation)?;

                    let (balance, currency) = if account_balance.is_map() {
                        let balance: ScriptAccountBalance =
                            rhai::serde::from_dynamic(&account_balance)
                                .map_err(Error::ScriptEvaluation)?;

                        totals
                            .entry(balance.currency.clone())
                            .and_modify(|entry| *entry += balance.amount)
                            .or_insert(balance.amount);

                        (balance.amount, balance.currency)
                    } else if account_balance.is_float() {
                        let balance = account_balance.cast::<rhai::FLOAT>();
                        totals
                            .entry(account.currency().to_string())
                            .and_modify(|entry| *entry += balance)
                            .or_insert(balance);

                        (balance, account.currency().to_string())
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
                                currency
                            );
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
                    let account_balance = Self::list_between(&account, from, to)?;

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
                let account_balance = Self::list_between(&account, from, to)?;

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
        let mut accounts = if let Some(account) = account {
            match Account::open(std::path::PathBuf::from_iter([accounts_path, account])) {
                Ok(account) => vec![account],
                Err(error) => {
                    println!("failed to open {account:?}: {error:?}");
                    vec![]
                }
            }
        } else {
            Self::list_accounts_paths(accounts_path)
                .into_iter()
                .filter_map(|path| match Account::open(&path) {
                    Ok(account) => Some(account),
                    Err(error) => {
                        println!("failed to open {path:?}: {error:?}");
                        None
                    }
                })
                .collect::<Vec<_>>()
        };
        accounts.sort_by(|a, b| a.name().cmp(b.name()));
        accounts
    }

    fn list_between(
        account: &Account,
        from: Option<&time::Date>,
        to: Option<&time::Date>,
    ) -> Result<f64, Error> {
        let transactions = account
            .transactions_between(from, to)
            .map_err(|error| Error::Account(error))?;

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
    fn execute(self) -> Result<(), Error> {
        let accounts_path = self.accounts.unwrap_or(".".to_string());
        let accounts_path = &accounts_path;

        self.command.run(accounts_path)
    }
}

fn main() -> Result<(), Error> {
    let cli = Cli::parse();
    cli.execute()
}
