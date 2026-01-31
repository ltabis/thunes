#[cfg(test)]
mod tests {
    use chrono::Datelike;
    use surrealdb::RecordId;
    use tauri::Manager;
    use thunes_cli::{
        budget::{category::ReadCategoryOptions, ExpensesPeriod},
        transaction::AddTransactionOptions,
    };
    use thunes_lib::commands::transaction::{add_transaction, get_transactions_by_category};

    use crate::tests::setup_expenses;

    #[tokio::test]
    pub async fn test_get_transactions_by_category() {
        let (app, budget, account) = setup_expenses().await;

        let now = chrono::Utc::now().with_day(1).unwrap();
        let category_transport: RecordId = ("category", "transport").into();
        let category_food: RecordId = ("category", "food").into();

        add_transaction(
            app.state(),
            account.id.clone(),
            AddTransactionOptions {
                amount: 30.0,
                category: Some(category_food.clone()),
                description: "Restaurant".to_string(),
                tags: vec![],
                date: Some(now.date_naive().and_hms_opt(1, 0, 0).unwrap().and_utc()),
            },
        )
        .await
        .unwrap();

        let result = get_transactions_by_category(
            app.state(),
            budget.id,
            ReadCategoryOptions {
                period: ExpensesPeriod::Monthly,
                category: category_transport.clone(),
                start_date: now,
            },
        )
        .await
        .unwrap();

        assert_eq!(result.category, category_transport);
        assert_eq!(result.transactions.len(), 2);
    }
}
