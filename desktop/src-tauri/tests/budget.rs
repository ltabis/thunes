#[cfg(test)]
mod common;

#[cfg(test)]
mod tests {
    use chrono::Datelike;
    use surrealdb::RecordId;
    use tauri::Manager;
    use thunes_cli::{
        account::{Account, AddAccountOptions},
        budget::{
            allocation::CreateAllocationOptions,
            expenses::{ExpensesPeriod, ReadExpensesOptions},
            partition::CreatePartitionOptions,
            Budget, CreateSplitBudgetOptions,
        },
        transaction::AddTransactionOptions,
    };
    use thunes_lib::commands::{
        account::add_account,
        budget::{
            add_budget, create_budget_allocation, create_budget_partition, get_budget_expenses,
        },
        transaction::add_transaction,
    };

    async fn setup() -> (tauri::App<tauri::test::MockRuntime>, Budget, Account) {
        let app = crate::common::setup().await;
        let account = add_account(
            app.state(),
            AddAccountOptions {
                currency: "EUR".to_string(),
                name: "My Account".to_string(),
            },
        )
        .await
        .expect("failed to create account");

        let budget = add_budget(
            app.state(),
            CreateSplitBudgetOptions {
                name: "My budget".to_string(),
                income: 2000.0,
                currency: "EUR".to_string(),
                accounts: vec![account.id.clone()],
            },
        )
        .await
        .expect("failed to create budget");

        (app, budget, account)
    }

    async fn setup_expenses() -> (tauri::App<tauri::test::MockRuntime>, Budget, Account) {
        let app = crate::common::setup().await;
        let account = add_account(
            app.state(),
            AddAccountOptions {
                currency: "EUR".to_string(),
                name: "My Account".to_string(),
            },
        )
        .await
        .expect("failed to create account");

        let budget = add_budget(
            app.state(),
            CreateSplitBudgetOptions {
                name: "My budget".to_string(),
                income: 2000.0,
                currency: "EUR".to_string(),
                accounts: vec![account.id.clone()],
            },
        )
        .await
        .expect("failed to create budget");

        let partition = create_budget_partition(
            app.state(),
            budget.id.clone(),
            CreatePartitionOptions {
                name: "Job expenses".to_string(),
                color: "blue".to_string(),
            },
        )
        .await
        .expect("failed to create partition");

        let category: RecordId = ("category", "transport").into();

        let _train = create_budget_allocation(
            app.state(),
            CreateAllocationOptions {
                name: "Train".to_string(),
                category: Some(category.clone()),
                amount: 50.0,
                partition: partition.id.clone(),
            },
        )
        .await
        .expect("failed to create allocations");
        let _plane = create_budget_allocation(
            app.state(),
            CreateAllocationOptions {
                name: "Plane".to_string(),
                category: Some(category.clone()),
                amount: 300.0,
                partition: partition.id.clone(),
            },
        )
        .await
        .expect("failed to create allocations");

        let now = chrono::Utc::now().with_day(1).unwrap();

        add_transaction(
            app.state(),
            account.id.clone(),
            AddTransactionOptions {
                amount: 25.0,
                category: Some(category.clone()),
                description: "Going to work".to_string(),
                tags: vec![],
                date: Some(now.date_naive().and_hms_opt(1, 0, 0).unwrap().and_utc()),
            },
        )
        .await
        .unwrap();

        add_transaction(
            app.state(),
            account.id.clone(),
            AddTransactionOptions {
                amount: 200.0,
                category: Some(category.clone()),
                description: "Going to summit".to_string(),
                tags: vec![],
                date: Some(
                    now.date_naive()
                        .with_day(15)
                        .unwrap()
                        .and_hms_opt(1, 0, 0)
                        .unwrap()
                        .and_utc(),
                ),
            },
        )
        .await
        .unwrap();
        add_transaction(
            app.state(),
            account.id.clone(),
            AddTransactionOptions {
                amount: 30.0,
                category: Some(category.clone()),
                description: "Going to work".to_string(),
                tags: vec![],
                date: Some(
                    now.date_naive()
                        .with_day(25)
                        .unwrap()
                        .checked_sub_months(chrono::Months::new(1))
                        .unwrap()
                        .and_hms_opt(1, 0, 0)
                        .unwrap()
                        .and_utc(),
                ),
            },
        )
        .await
        .unwrap();

        (app, budget, account)
    }

    #[tokio::test]
    pub async fn test_basic_50_30_20() {
        let (_app, budget, _account) = setup().await;

        assert_eq!(budget.currency, "EUR");
        assert_eq!(budget.name, "My budget");
        assert_eq!(budget.income, 2000.0);
    }

    #[tokio::test]
    pub async fn test_add_partitions_and_allocations() {
        let (app, budget, _account) = setup().await;

        let partition = create_budget_partition(
            app.state(),
            budget.id.clone(),
            CreatePartitionOptions {
                name: "Job expenses".to_string(),
                color: "blue".to_string(),
            },
        )
        .await
        .expect("failed to create partition");

        let allocation = create_budget_allocation(
            app.state(),
            CreateAllocationOptions {
                name: "Commute".to_string(),
                category: None,
                amount: 200.0,
                partition: partition.id.clone(),
            },
        )
        .await
        .expect("failed to create allocations");

        assert_eq!(partition.budget, budget.id);
        assert_eq!(partition.name, "Job expenses");

        assert_eq!(allocation.partition, partition.id);
        assert_eq!(allocation.name, "Commute");
        assert_eq!(allocation.amount, 200.0);
    }

    #[tokio::test]
    pub async fn test_get_expenses_monthly() {
        let (app, budget, _account) = setup_expenses().await;

        let now = chrono::Utc::now().with_day(1).unwrap();
        let expenses = get_budget_expenses(
            app.state(),
            budget.id,
            ReadExpensesOptions {
                period: ExpensesPeriod::Monthly,
                start_date: now,
            },
        )
        .await
        .unwrap();

        assert_eq!(expenses.budget.transactions_total, 225.0);
        assert_eq!(expenses.budget.allocations_total, 350.0);
    }

    #[tokio::test]
    pub async fn test_get_expenses_trimestrial() {
        let (app, budget, _account) = setup_expenses().await;

        let now = chrono::Utc::now().with_day(1).unwrap();
        let expenses = get_budget_expenses(
            app.state(),
            budget.id,
            ReadExpensesOptions {
                period: ExpensesPeriod::Trimestrial,
                start_date: now,
            },
        )
        .await
        .unwrap();

        assert_eq!(expenses.budget.transactions_total, 225.0);
        assert_eq!(expenses.budget.allocations_total, 350.0 * 3.0);
    }

    #[tokio::test]
    pub async fn test_get_expenses_yearly() {
        let (app, budget, _account) = setup_expenses().await;

        let now = chrono::Utc::now().with_day(1).unwrap();
        let expenses = get_budget_expenses(
            app.state(),
            budget.id,
            ReadExpensesOptions {
                period: ExpensesPeriod::Yearly,
                start_date: now,
            },
        )
        .await
        .unwrap();

        assert_eq!(expenses.budget.transactions_total, 225.0);
        assert_eq!(expenses.budget.allocations_total, 350.0 * 12.0);
    }
}
