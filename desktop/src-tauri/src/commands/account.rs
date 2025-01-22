use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tauri::State;
use tunes_cli::account::Account;
use tunes_cli::transaction::{Tag, TransactionWithId};

pub type Accounts = std::collections::HashMap<String, Account>;

#[tauri::command]
pub async fn list_accounts(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<String>, ()> {
    // FIXME: unwraps.
    let database = database.lock().await;
    let accounts: Vec<Account> = database.select("account").await.unwrap();

    Ok(accounts
        .into_iter()
        .map(|account| account.data.name)
        .collect())
}

#[tauri::command]
pub async fn get_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
) -> Result<f64, ()> {
    let database = database.lock().await;
    let transactions: Vec<TransactionWithId> = database
        .query(format!(
            r#"SELECT * FROM transaction WHERE account = 'account:"{account}"'"#
        ))
        .await
        .unwrap()
        .take(0)
        .unwrap();

    Ok(transactions.iter().map(|t| t.inner.amount()).sum())
}

#[tauri::command]
pub async fn get_balance_by_tag(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
    tag: &str,
) -> Result<f64, ()> {
    let database = database.lock().await;
    let transactions: Vec<TransactionWithId> = database
        .query(format!(
            r#"SELECT * FROM transaction WHERE account = 'account:"{account}"'"#
        ))
        .await
        .unwrap()
        .take(0)
        .unwrap();

    // FIXME: use the query instead.
    Ok(transactions
        .iter()
        .filter_map(|t| {
            if t.inner.tags().iter().find(|t| t.label == tag).is_some() {
                Some(t.inner.amount())
            } else {
                None
            }
        })
        .sum())
}

#[tauri::command]
pub async fn get_currency(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
) -> Result<String, String> {
    let database = database.lock().await;
    let account: Account = database
        .select(("account", format!(r#""{account}""#)))
        .await
        .unwrap()
        .unwrap();

    Ok(account.data.currency)
}

#[tauri::command]
pub async fn get_transactions(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
) -> Result<Vec<TransactionWithId>, String> {
    let database = database.lock().await;

    Ok(database
        .query(format!(
            r#"SELECT * FROM transaction WHERE account = 'account:"{account}"'"#
        ))
        .await
        .unwrap()
        .take(0)
        .unwrap())
}

#[tauri::command]
pub async fn add_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
    operation: String,
    amount: f64,
    description: String,
    tags: Vec<Tag>,
) -> Result<(), String> {
    let database = database.lock().await;

    tunes_cli::add_transaction(&database, account, &operation, amount, description, tags)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn update_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    transaction: TransactionWithId,
) -> Result<(), String> {
    let database = database.lock().await;

    let _: Option<crate::Record> = database
        .update(("transaction", transaction.id.key().clone()))
        .merge(transaction)
        .await
        .unwrap();

    Ok(())
}

#[tauri::command]
pub fn get_date() -> serde_json::Value {
    serde_json::to_value(&time::OffsetDateTime::now_utc().date()).unwrap()
}
