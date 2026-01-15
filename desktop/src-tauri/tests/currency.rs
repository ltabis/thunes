#[cfg(test)]
mod common;

#[cfg(test)]
mod tests {
    use tauri::Manager;
    use thunes_cli::currency::{AddCurrencyOptions, CurrencyWithId};
    use thunes_lib::commands::currency::add_currency;

    async fn setup() -> (tauri::App<tauri::test::MockRuntime>, CurrencyWithId) {
        let app = crate::common::setup().await;
        let currency = add_currency(
            app.state(),
            AddCurrencyOptions {
                name: "Euro".to_string(),
                symbol: Some("€".to_string()),
                decimal_digits: 2,
            },
        )
        .await
        .expect("failed to create currency");

        (app, currency)
    }

    #[tokio::test]
    pub async fn test_add_currency() {
        let (app, currency1) = setup().await;
        let currency2 = add_currency(
            app.state(),
            AddCurrencyOptions {
                name: "Bitcoin".to_string(),
                symbol: Some("₿".to_string()),
                decimal_digits: 8,
            },
        )
        .await
        .expect("failed to create currency");

        assert_eq!(currency1.data.name, "Euro".to_string());
        assert_eq!(currency1.data.symbol, Some("€".to_string()));
        assert_eq!(currency1.data.decimal_digits, 2);
        assert_eq!(currency2.data.name, "Bitcoin".to_string());
        assert_eq!(currency2.data.symbol, Some("₿".to_string()));
        assert_eq!(currency2.data.decimal_digits, 8);
    }
}
