use surrealdb::engine::local::Db;
use surrealdb::{RecordId, Surreal};
use tauri::State;
use thunes_cli::budget::{
    Allocation, Budget, BudgetIdentifiers, CreateAllocationOptions, CreatePartitionOptions,
    Partition, UpdateAllocationOptions,
};
use thunes_cli::Error as ThunesError;

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn list_budgets(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<BudgetIdentifiers>, String> {
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
        .map_err(|error| match error {
            ThunesError::Database(error) => {
                tracing::error!(%error, "database error");
                "failed to add budget".to_string()
            }
            // Note: should not happen. See the function internals.
            ThunesError::RecordNotFound => {
                tracing::error!("budget not found after creation");
                "failed to create budget".to_string()
            }
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
        .map_err(|error| match error {
            ThunesError::Database(error) => {
                tracing::error!(%error, "database error");
                "failed to get budget".to_string()
            }
            ThunesError::RecordNotFound => {
                tracing::error!("budget not found");
                "failed to get budget, not found".to_string()
            }
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
pub async fn create_budget_partition(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    budget_id: RecordId,
    options: CreatePartitionOptions,
) -> Result<Partition, String> {
    let database = database.lock().await;

    thunes_cli::budget::create_partition(&database, budget_id, options)
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

    thunes_cli::budget::get_partitions(&database, budget_id)
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

    thunes_cli::budget::update_partition(&database, options)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update budget partition".to_string()
        })
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn create_budget_allocation(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: CreateAllocationOptions,
) -> Result<Allocation, String> {
    let database = database.lock().await;

    thunes_cli::budget::create_allocation(&database, options)
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

    thunes_cli::budget::get_allocations(&database, partitions)
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

    thunes_cli::budget::update_allocation(&database, options)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to update budget allocation".to_string()
        })
}
