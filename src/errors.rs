#[derive(Debug)]
pub enum CommandError {
    CreateAccount(String, std::io::Error),
    OpenAccount(String, std::io::Error),
    WriteToAccount(String, std::io::Error),
}
