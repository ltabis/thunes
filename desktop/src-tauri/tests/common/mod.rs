pub async fn setup() -> tauri::App<tauri::test::MockRuntime> {
    use tauri::Manager;

    let app = tauri::test::mock_builder()
        .invoke_handler(tauri::generate_handler![
            thunes_lib::commands::account::add_account
        ])
        .build(tauri::generate_context!())
        .expect("failed to build app");

    let db: surrealdb::Surreal<surrealdb::engine::local::Db> = surrealdb::Surreal::init();
    db.connect::<surrealdb::engine::local::Mem>(())
        .await
        .map_err(|error| error.to_string())
        .expect("failed to initialize database");

    db.use_ns("user")
        .use_db("accounts")
        .await
        .map_err(|error| error.to_string())
        .expect("failed to switch namespace and database");

    app.manage(tokio::sync::Mutex::new(db));

    app
}
