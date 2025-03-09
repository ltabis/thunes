use tauri::{App, Manager};
use thunes_cli::{category::Icon, settings::Settings, Record};

pub mod commands {
    pub mod account;
    pub mod categories;
    pub mod settings;
    pub mod tags;
}

fn setup(app: &mut App) -> std::result::Result<(), Box<dyn std::error::Error>> {
    // Setup dev tools.
    #[cfg(debug_assertions)]
    {
        app.get_webview_window("main")
            .map(|window| window.open_devtools())
            .or_else(|| {
                eprintln!("dev: failed to open dev tools");
                None
            });
    }

    // a builder for `FmtSubscriber`.
    let subscriber = tracing_subscriber::FmtSubscriber::builder()
        // all spans/events with a level higher than TRACE (e.g, debug, info, warn, etc.)
        // will be written to stdout.
        .with_max_level(tracing::Level::INFO)
        .compact()
        // completes the builder.
        .finish();

    tracing::subscriber::set_global_default(subscriber)?;

    // Setup surreal database.
    let path_resolver = app.path();

    let mut path = path_resolver.app_config_dir()?;

    path.push("store");

    let mut data_dir = path_resolver.app_data_dir()?;

    data_dir.push("backups");

    let db = tauri::async_runtime::block_on(tauri::async_runtime::spawn(async {
        let db: surrealdb::Surreal<surrealdb::engine::local::Db> = surrealdb::Surreal::init();
        db.connect::<surrealdb::engine::local::RocksDb>(path)
            .await
            .map_err(|error| error.to_string())?;

        db.use_ns("user")
            .use_db("accounts")
            .await
            .map_err(|error| error.to_string())?;

        // FIXME: move db seeding to an install script.
        // Categories
        {
            let result: Result<Vec<Record>, surrealdb::Error> = db
                .insert("category")
                .content(vec![
                    thunes_cli::category::Category {
                        name: "Transport".to_string(),
                        icon: Icon::Transport,
                    },
                    thunes_cli::category::Category {
                        name: "Accommodation".to_string(),
                        icon: Icon::Accommodation,
                    },
                    thunes_cli::category::Category {
                        name: "Subscription".to_string(),
                        icon: Icon::Subscription,
                    },
                    thunes_cli::category::Category {
                        name: "Car".to_string(),
                        icon: Icon::Car,
                    },
                    thunes_cli::category::Category {
                        name: "Other".to_string(),
                        icon: Icon::Other,
                    },
                    thunes_cli::category::Category {
                        name: "Gift & Donations".to_string(),
                        icon: Icon::GiftAndDonations,
                    },
                    thunes_cli::category::Category {
                        name: "Savings".to_string(),
                        icon: Icon::Savings,
                    },
                    thunes_cli::category::Category {
                        name: "Education & Family".to_string(),
                        icon: Icon::EducationAndFamily,
                    },
                    thunes_cli::category::Category {
                        name: "Loan".to_string(),
                        icon: Icon::Loan,
                    },
                    thunes_cli::category::Category {
                        name: "Professional Fee".to_string(),
                        icon: Icon::ProfessionalFee,
                    },
                    thunes_cli::category::Category {
                        name: "Taxes".to_string(),
                        icon: Icon::Taxes,
                    },
                    thunes_cli::category::Category {
                        name: "Spare-time Activities".to_string(),
                        icon: Icon::SpareTimeActivities,
                    },
                    thunes_cli::category::Category {
                        name: "Internal Movements".to_string(),
                        icon: Icon::InternalMovements,
                    },
                    thunes_cli::category::Category {
                        name: "Cash Withdrawal".to_string(),
                        icon: Icon::CashWithdrawal,
                    },
                    thunes_cli::category::Category {
                        name: "Health".to_string(),
                        icon: Icon::Health,
                    },
                    thunes_cli::category::Category {
                        name: "Everyday Life".to_string(),
                        icon: Icon::EverydayLife,
                    },
                ])
                .await;

            match result {
                Ok(_) | Err(surrealdb::Error::Db(surrealdb::error::Db::RecordExists { .. })) => {}
                _ => {
                    tracing::error!("failed to initialize categories");
                    return Err("failed to initialize categories".to_string());
                }
            }
        }

        // FIXME: move db seeding to an install script.
        // Settings.
        {
            let result: Result<Option<Record>, surrealdb::Error> = db
                .insert(("settings", "main"))
                .content(Settings::new(data_dir))
                .await;

            match result {
                Ok(_) | Err(surrealdb::Error::Db(surrealdb::error::Db::RecordExists { .. })) => {}
                _ => {
                    tracing::error!("failed to initialize settings");
                    return Err("failed to initialize settings".to_string());
                }
            }
        }

        Ok(db)
    }))??;

    app.manage(tokio::sync::Mutex::new(db));

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::account::get_account,
            commands::account::update_account,
            commands::account::list_accounts,
            commands::account::add_account,
            commands::account::delete_account,
            commands::account::get_transactions,
            commands::account::get_currency,
            commands::account::get_balance,
            commands::account::get_all_balance,
            commands::account::add_transaction,
            commands::account::update_transaction,
            commands::tags::get_tags,
            commands::tags::add_tags,
            commands::categories::get_categories,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::backup_export,
            commands::settings::backup_import,
        ])
        .setup(setup)
        .run(tauri::generate_context!())
        .expect("error while running application");
}
