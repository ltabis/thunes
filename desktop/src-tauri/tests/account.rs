#[cfg(test)]
mod common;

#[cfg(test)]
mod tests {
    use tauri::Manager;
    use thunes_cli::account::{Account, AddAccountOptions};
    use thunes_lib::commands::account::{
        add_account, delete_account, get_account, list_accounts, list_accounts_with_details,
        update_account,
    };

    async fn setup() -> (tauri::App<tauri::test::MockRuntime>, Account) {
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

        (app, account)
    }

    #[tokio::test]
    pub async fn test_accounts_creation() {
        let (app, account1) = setup().await;
        let account2 = add_account(
            app.state(),
            AddAccountOptions {
                currency: "$".to_string(),
                name: "My FREEDOM Account".to_string(),
            },
        )
        .await
        .expect("failed to create account");

        assert_eq!(account1.data.currency, "EUR");
        assert_eq!(account1.data.name, "My Account");
        assert_eq!(account2.data.currency, "$");
        assert_eq!(account2.data.name, "My FREEDOM Account");
    }

    #[tokio::test]
    pub async fn test_account_list() {
        let (app, _account) = setup().await;

        let accounts = list_accounts(app.state())
            .await
            .expect("failed to list accounts");

        assert_eq!(accounts.len(), 1);
        assert_eq!(accounts[0].name, "My Account".to_string());
    }

    #[tokio::test]
    pub async fn test_account_list_with_details() {
        let (app, _account) = setup().await;

        let accounts = list_accounts_with_details(app.state())
            .await
            .expect("failed to list accounts");

        assert_eq!(accounts.len(), 1);
        assert_eq!(accounts[0].data.name, "My Account".to_string());
        assert_eq!(accounts[0].data.currency, "EUR".to_string());
    }

    #[tokio::test]
    pub async fn test_account_get() {
        let (app, account) = setup().await;

        let account = get_account(app.state(), account.id)
            .await
            .expect("failed to get account");

        assert_eq!(account.data.currency, "EUR");
        assert_eq!(account.data.name, "My Account");
    }

    #[tokio::test]
    pub async fn test_account_update() {
        let (app, mut account) = setup().await;

        account.data.currency = "BTC".to_string();
        update_account(app.state(), account.clone())
            .await
            .expect("failed to create account");
        let account = get_account(app.state(), account.id)
            .await
            .expect("failed to create account");

        assert_eq!(account.data.currency, "BTC");
        assert_eq!(account.data.name, "My Account");
    }

    #[tokio::test]
    pub async fn test_account_delete() {
        let (app, account) = setup().await;

        delete_account(app.state(), account.id.clone())
            .await
            .expect("failed to create account");
        assert!(get_account(app.state(), account.id).await.is_err())
    }
}
