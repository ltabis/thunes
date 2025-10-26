use crate::migrations::Migration;

pub struct AccountFilterMigration {}

impl Migration for AccountFilterMigration {
    fn name(&self) -> &'static str {
        "Adding transaction filtering persistance for every account"
    }

    fn version(&self) -> &'static str {
        "0.5.0"
    }

    fn up(&self) -> &'static str {
        include_str!("m1/up.surql")
    }

    fn down(&self) -> &'static str {
        include_str!("m1/down.surql")
    }
}
