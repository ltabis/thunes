use tauri::{App, Manager};
use thunes_cli::{
    settings::Settings,
    transaction::{Category, CategoryWithId, Icon},
    Record,
};

pub mod commands {
    pub mod account;
    pub mod budget;
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
                    CategoryWithId {
                        id: ("category", "transport").into(),
                        data: Category {
                            name: "Transport".to_string(),
                            icon: Icon::Transport,
                            color: "yellow".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "accommodation").into(),
                        data: Category {
                            name: "Accommodation".to_string(),
                            icon: Icon::Accommodation,
                            color: "orange".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "subscription").into(),
                        data: Category {
                            name: "Subscription".to_string(),
                            icon: Icon::Subscription,
                            color: "blue".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "car").into(),
                        data: Category {
                            name: "Car".to_string(),
                            icon: Icon::Car,
                            color: "yellow".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "other").into(),
                        data: Category {
                            name: "Other".to_string(),
                            icon: Icon::Other,
                            color: "grey".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "gift-and-donations").into(),
                        data: Category {
                            name: "Gift & Donations".to_string(),
                            icon: Icon::GiftAndDonations,
                            color: "orange".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "savings").into(),
                        data: Category {
                            name: "Savings".to_string(),
                            icon: Icon::Savings,
                            color: "red".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "education-and-family").into(),
                        data: Category {
                            name: "Education & Family".to_string(),
                            icon: Icon::EducationAndFamily,
                            color: "pink".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "loan").into(),
                        data: Category {
                            name: "Loan".to_string(),
                            icon: Icon::Loan,
                            color: "red".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "professional-fee").into(),
                        data: Category {
                            name: "Professional Fee".to_string(),
                            icon: Icon::ProfessionalFee,
                            color: "blue".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "taxes").into(),
                        data: Category {
                            name: "Taxes".to_string(),
                            icon: Icon::Taxes,
                            color: "red".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "spare-time-activities").into(),
                        data: Category {
                            name: "Spare-time Activities".to_string(),
                            icon: Icon::SpareTimeActivities,
                            color: "pink".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "internal-movements").into(),
                        data: Category {
                            name: "Internal Movements".to_string(),
                            icon: Icon::InternalMovements,
                            color: "blue".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "cash-withdrawal").into(),
                        data: Category {
                            name: "Cash Withdrawal".to_string(),
                            icon: Icon::CashWithdrawal,
                            color: "green".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "health").into(),
                        data: Category {
                            name: "Health".to_string(),
                            icon: Icon::Health,
                            color: "green".to_string(),
                        },
                    },
                    CategoryWithId {
                        id: ("category", "everyday-life").into(),
                        data: Category {
                            name: "Everyday Life".to_string(),
                            icon: Icon::EverydayLife,
                            color: "blue".to_string(),
                        },
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
            commands::account::list_accounts_with_details,
            commands::account::add_account,
            commands::account::delete_account,
            commands::account::get_transactions,
            commands::account::get_currency,
            commands::account::get_balance,
            commands::account::get_all_balance,
            commands::account::add_transaction,
            commands::account::update_transaction,
            commands::budget::list_budgets,
            commands::budget::add_budget,
            commands::budget::get_budget,
            commands::budget::update_budget,
            commands::budget::delete_budget,
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
