use clap::Parser;
use clap::Subcommand;
use thunes_cli::account::Account;
use thunes_cli::transaction::Tag;
use thunes_cli::AddTransactionOptions;
use thunes_cli::BalanceOptions;

#[derive(Debug)]
pub enum Error {
    Operation(thunes_cli::Error),
    InvalidDate(time::error::Parse),
    ScriptEvaluation(Box<rhai::EvalAltResult>),
}

impl From<thunes_cli::Error> for Error {
    fn from(value: thunes_cli::Error) -> Self {
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
        /// Name of the account to display the balance from. If not specified, will aggregate all
        /// balances from the accounts in the `--accounts` directory.
        #[arg(short, long, value_name = "ACCOUNT-NAME")]
        account: Option<String>,
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

    pub async fn run(self, database_path: &str) -> Result<(), Error> {
        let db = thunes_cli::init_db(database_path).await;

        match self {
            Commands::New { name, currency } => Account::new(&db, &name, &currency)
                .await
                .map(|_| ())
                .map_err(|err| err.into()),

            Commands::Income {
                account,
                amount,
                description,
                tags,
            } => thunes_cli::add_transaction(
                &db,
                &account,
                AddTransactionOptions {
                    amount,
                    description,
                    tags: tags
                        .into_iter()
                        .map(|tag| Tag {
                            label: tag.clone(),
                            color: None,
                        })
                        .collect(),
                    date: None,
                },
            )
            .await
            .map_err(|err| err.into()),

            Commands::Spend {
                account,
                amount,
                description,
                tags,
            } => thunes_cli::add_transaction(
                &db,
                &account,
                AddTransactionOptions {
                    amount: -amount,
                    description,
                    tags: tags
                        .into_iter()
                        .map(|tag| Tag {
                            label: tag.clone(),
                            color: None,
                        })
                        .collect(),
                    date: None,
                },
            )
            .await
            .map_err(|err| err.into()),

            Commands::Balance { account, script: _ } => {
                let balance = thunes_cli::balance(
                    &db,
                    // TODO: multiple accounts.
                    account.unwrap().as_str(),
                    // TODO: scripts.
                    BalanceOptions::default(),
                )
                .await?;

                // FIXME: use old format.
                println!("balance: {balance}");
                Ok(())
            }
        }
    }

    // fn balance(
    //     accounts_path: &str,
    //     account: Option<&String>,
    //     from: Option<&time::Date>,
    //     to: Option<&time::Date>,
    //     script: Option<&std::path::PathBuf>,
    // ) -> Result<(), Error> {
    //     let totals = if let Some(script) = script {
    //         let engine = script::build_engine(script);
    //         let accounts = Self::get_accounts(accounts_path, account);

    //         let ast = engine
    //             .compile_file(script.into())
    //             .map_err(Error::ScriptEvaluation)?;
    //         let mut totals = std::collections::HashMap::<String, f64>::new();

    //         for account in accounts {
    //             let fn_name = format!("on_{}", account.name());
    //             if ast.iter_functions().any(|func| func.name == fn_name) {
    //                 let transactions = account
    //                     .transactions_between(from, to)
    //                     .map_err(|error| Error::Account(error))?;

    //                 let parameters: rhai::Dynamic = transactions
    //                     .iter()
    //                     .map(TransactionRhai::from)
    //                     .collect::<Vec<TransactionRhai>>()
    //                     .into();

    //                 let account_balance = engine
    //                     .call_fn::<rhai::Dynamic>(
    //                         &mut rhai::Scope::new(),
    //                         &ast,
    //                         fn_name,
    //                         (parameters,),
    //                     )
    //                     .map_err(Error::ScriptEvaluation)?;

    //                 let (balance, currency) = if account_balance.is_map() {
    //                     let balance: ScriptAccountBalance =
    //                         rhai::serde::from_dynamic(&account_balance)
    //                             .map_err(Error::ScriptEvaluation)?;

    //                     totals
    //                         .entry(balance.currency.clone())
    //                         .and_modify(|entry| *entry += balance.amount)
    //                         .or_insert(balance.amount);

    //                     (balance.amount, balance.currency)
    //                 } else if account_balance.is_float() {
    //                     let balance = account_balance.cast::<rhai::FLOAT>();
    //                     totals
    //                         .entry(account.currency().to_string())
    //                         .and_modify(|entry| *entry += balance)
    //                         .or_insert(balance);

    //                     (balance, account.currency().to_string())
    //                 } else {
    //                     // FIXME: better error.
    //                     return Err(Error::ScriptEvaluation(Box::new(
    //                         rhai::EvalAltResult::ErrorRuntime(
    //                             rhai::Dynamic::from("return value must be a map or float"),
    //                             rhai::Position::NONE,
    //                         ),
    //                     )));
    //                 };

    //                 match (transactions.first(), transactions.last()) {
    //                     (Some(from), Some(to)) => {
    //                         println!(
    //                             "[{}/{}] balance for '{}': {:.2} {}",
    //                             from.date(),
    //                             to.date(),
    //                             account.name(),
    //                             balance,
    //                             currency
    //                         );
    //                     }
    //                     _ => {
    //                         println!(
    //                             "balance for '{}': 0.00 {}",
    //                             account.name(),
    //                             account.currency()
    //                         );
    //                     }
    //                 }
    //             } else {
    //                 let account_balance = Self::list_between(&account, from, to)?;

    //                 totals
    //                     .entry(account.currency().to_string())
    //                     .and_modify(|entry| *entry += account_balance)
    //                     .or_insert(account_balance);
    //             }
    //         }

    //         totals
    //     } else {
    //         let mut totals = std::collections::HashMap::<String, f64>::new();
    //         let accounts = Self::get_accounts(accounts_path, account);

    //         for account in accounts {
    //             let account_balance = Self::list_between(&account, from, to)?;

    //             totals
    //                 .entry(account.currency().to_string())
    //                 .and_modify(|entry| *entry += account_balance)
    //                 .or_insert(account_balance);
    //         }

    //         totals
    //     };

    //     let mut totals: Vec<(String, f64)> = totals
    //         .into_iter()
    //         .map(|(currency, total)| (currency.to_string(), total))
    //         .collect();
    //     totals.sort_by(|(c1, _), (c2, _)| c1.cmp(c2));

    //     println!("\nTotals:");

    //     for (currency, total) in totals {
    //         println!("  {total:.2} {currency}");
    //     }

    //     Ok(())
    // }

    // fn list_between(
    //     account: &Account,
    //     from: Option<&time::Date>,
    //     to: Option<&time::Date>,
    // ) -> Result<f64, Error> {
    //     let transactions = account
    //         .transactions_between(from, to)
    //         .map_err(|error| Error::Account(error))?;

    //     match (transactions.first(), transactions.last()) {
    //         (Some(from), Some(to)) => {
    //             let balance: f64 = transactions.iter().map(|op| op.amount()).sum();

    //             println!(
    //                 "[{}/{}] balance for '{}': {:.2} {}",
    //                 from.date(),
    //                 to.date(),
    //                 account.name(),
    //                 balance,
    //                 account.currency()
    //             );

    //             Ok(balance)
    //         }
    //         _ => {
    //             println!(
    //                 "balance for '{}': 0.00 {}",
    //                 account.name(),
    //                 account.currency()
    //             );
    //             Ok(0.0)
    //         }
    //     }
    // }
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
    async fn execute(self) -> Result<(), Error> {
        let database_path = self.accounts.unwrap_or(".".to_string());
        let database_path = &database_path;

        self.command.run(database_path).await
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let cli = Cli::parse();
    cli.execute().await
}
