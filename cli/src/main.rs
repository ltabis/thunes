use clap::Parser;
use tunes_cli::{Commands, Error};

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
