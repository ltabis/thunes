use surrealdb::engine::local::Db;
use surrealdb::{RecordId, Surreal};
use tauri::State;
use thunes_cli::budget::allocation::{
    Allocation, CreateAllocationOptions, UpdateAllocationOptions,
};
use thunes_cli::budget::expenses::ReadExpensesOptions;
use thunes_cli::budget::expenses::ReadExpensesResult;
use thunes_cli::budget::partition::CreatePartitionOptions;
use thunes_cli::budget::partition::Partition;
use thunes_cli::budget::Budget;
#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn list_budgets(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<Budget>, String> {
    let database = database.lock().await;

    thunes_cli::budget::list(&database).await.map_err(|error| {
        tracing::error!(%error, "database error");
        "failed to list budgets".to_string()
    })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_budget(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: thunes_cli::budget::CreateSplitBudgetOptions,
) -> Result<Budget, String> {
    let database = database.lock().await;

    thunes_cli::budget::create_split(&database, options)
        .await
        .map_err(|error| {
            error.trace();
            "failed to add budget".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_budget(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget_id: RecordId,
) -> Result<Budget, String> {
    let database = database.lock().await;

    thunes_cli::budget::read(&database, budget_id)
        .await
        .map_err(|error| {
            error.trace();
            "failed to get budget".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_budget(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget: Budget,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::budget::update(&database, budget)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update budget".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn delete_budget(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget_id: RecordId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::budget::delete(&database, budget_id)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to delete budget".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_budget_expenses(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget_id: RecordId,
    options: ReadExpensesOptions,
) -> Result<ReadExpensesResult, String> {
    let database = database.lock().await;

    thunes_cli::budget::expenses::read(&database, budget_id, options)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to read budget expenses".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn create_budget_partition(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget_id: RecordId,
    options: CreatePartitionOptions,
) -> Result<Partition, String> {
    let database = database.lock().await;

    thunes_cli::budget::partition::create(&database, budget_id, options)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to create budget partition".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_budget_partitions(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget_id: RecordId,
) -> Result<Vec<Partition>, String> {
    let database = database.lock().await;

    thunes_cli::budget::partition::read(&database, budget_id)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to get budget partitions".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_budget_partition(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: Partition,
) -> Result<Partition, String> {
    let database = database.lock().await;

    thunes_cli::budget::partition::update(&database, options)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update budget partition".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn delete_budget_partition(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    partition: surrealdb::RecordId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::budget::partition::delete(&database, partition)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to delete budget partition".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn create_budget_allocation(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: CreateAllocationOptions,
) -> Result<Allocation, String> {
    let database = database.lock().await;

    thunes_cli::budget::allocation::create(&database, options)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to create budget allocation".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_budget_allocations(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    partitions: Vec<RecordId>,
) -> Result<Vec<Allocation>, String> {
    let database = database.lock().await;

    thunes_cli::budget::allocation::read(&database, partitions)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to get budget allocations".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_budget_allocation(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: UpdateAllocationOptions,
) -> Result<Allocation, String> {
    let database = database.lock().await;

    thunes_cli::budget::allocation::update(&database, options)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update budget allocation".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn delete_budget_allocation(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    allocation: surrealdb::RecordId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::budget::allocation::delete(&database, allocation)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to delete budget allocation".to_string()
        })
}
