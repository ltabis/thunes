use surrealdb::{engine::local::Db, Surreal};

pub mod m1_account_filter;

pub trait Migration {
    fn name(&self) -> &'static str;
    fn version(&self) -> &'static str;
    fn up(&self) -> &'static str;
    fn down(&self) -> &'static str;
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Metadata {
    applied_on: surrealdb::Datetime,
}

// FIXME: would be better as a macro, since all migrations are known at compile time.
/// Migrations should be ordered by semver.
pub async fn run_migrations(
    migrations: Vec<Box<dyn Migration + Send>>,
    db: &Surreal<Db>,
) -> Result<(), ()> {
    tracing::info!("Applying migrations.");

    for migration in migrations {
        let name = migration.name();
        let version = migration.version();
        let is_applied: Result<Option<Metadata>, _> = db.select(("migration", version)).await;

        match is_applied {
            Ok(is_applied) if is_applied.is_some() => {
                tracing::debug!(%name, %version, "Migration already applied, skipping.");
                continue;
            }
            Ok(_) => {
                tracing::debug!(%name, %version, "Applying migration.");
            }
            Err(error) => {
                tracing::error!(%name, %version, %error, "Failed to get migration metadata.");
                return Err(());
            }
        }

        match db.query(migration.up()).await {
            Ok(_) => {
                tracing::info!(%name, %version, "Migration successful");

                let result: Result<Option<Metadata>, _> = db
                    .create(("migration", version))
                    .content(Metadata {
                        applied_on: surrealdb::Datetime::default(),
                    })
                    .await;

                if let Err(error) = result {
                    tracing::error!(%name, %version, %error, "Migration succeeded but failed to record migration metadata.");
                    return Err(());
                }
            }
            Err(error) => {
                tracing::error!(%name, %version, %error, "Migration failed. Reverting.");
                if let Err(error) = db.query(migration.down()).await {
                    tracing::error!(%name, %version, %error, "Failed to revert migration.");
                }
                return Err(());
            }
        }
    }

    tracing::info!("Finished applying migrations.");

    Ok(())
}
