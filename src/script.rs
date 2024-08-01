use rhai::packages::Package;
use rhai::plugin::*;

use crate::transaction::TransactionRhai;

#[export_module]
pub mod env {
    /// Get an environement variable by name.
    ///
    /// rhai-autodocs:index:1
    pub fn variable(variable: &str) -> rhai::Dynamic {
        std::env::var(variable)
            .ok()
            .map(rhai::Dynamic::from)
            .unwrap_or_default()
    }
}

#[export_module]
pub mod time_helper {
    use crate::{TIME_FORMAT, TIME_FORMAT_DAY, TIME_FORMAT_MONTH, TIME_FORMAT_YEAR};

    pub type Date = time::Date;

    /// Creat a new date from a string.
    ///
    /// rhai-autodocs:index:1
    #[rhai_fn(return_raw)]
    pub fn new_date(date: &str) -> Result<Date, Box<rhai::EvalAltResult>> {
        Date::parse(date, TIME_FORMAT)
            .map_err::<Box<rhai::EvalAltResult>, _>(|error| error.to_string().into())
    }

    /// Get the current date.
    ///
    /// rhai-autodocs:index:1
    pub fn now() -> String {
        let now = time::OffsetDateTime::now_utc();

        now.format(&TIME_FORMAT)
            .unwrap_or_else(|_| String::default())
    }

    /// Get the current day.
    ///
    /// rhai-autodocs:index:1
    pub fn day() -> String {
        let now = time::OffsetDateTime::now_utc();

        now.format(&TIME_FORMAT_DAY)
            .unwrap_or_else(|_| String::default())
    }

    /// Get the current month.
    ///
    /// rhai-autodocs:index:1
    pub fn month() -> String {
        let now = time::OffsetDateTime::now_utc();

        now.format(&TIME_FORMAT_MONTH)
            .unwrap_or_else(|_| String::default())
    }

    /// Get the current year.
    ///
    /// rhai-autodocs:index:1
    pub fn year() -> String {
        let now = time::OffsetDateTime::now_utc();

        now.format(&TIME_FORMAT_YEAR)
            .unwrap_or_else(|_| String::default())
    }

    #[rhai_fn(name = "==")]
    pub fn date_eq(date1: &mut Date, date2: Date) -> bool {
        *date1 == date2
    }

    #[rhai_fn(name = "!=")]
    pub fn date_neq(date1: &mut Date, date2: Date) -> bool {
        *date1 != date2
    }

    #[rhai_fn(name = ">=")]
    pub fn date_sup(date1: &mut Date, date2: Date) -> bool {
        *date1 >= date2
    }

    #[rhai_fn(name = "<=")]
    pub fn date_inf(date1: &mut Date, date2: Date) -> bool {
        *date1 <= date2
    }

    #[rhai_fn(name = "to_string")]
    pub fn date_to_string(date: &mut Date) -> String {
        date.to_string()
    }

    #[rhai_fn(name = "to_debug")]
    pub fn date_to_debug(date: &mut Date) -> String {
        format!("{date:?}")
    }
}

#[export_module]
pub mod prelude {
    use crate::transaction::TransactionRhai;

    /// Sum the total of the given transaction array.
    ///
    /// rhai-autodocs:index:2
    #[rhai_fn(return_raw)]
    pub fn sum(transactions: &mut rhai::Array) -> Result<rhai::FLOAT, Box<rhai::EvalAltResult>> {
        let transactions = transactions
            .iter()
            .map(|d| d.clone().try_cast())
            .collect::<Option<Vec<TransactionRhai>>>()
            .ok_or_else::<Box<rhai::EvalAltResult>, _>(|| {
                "failed to parse transactions".to_string().into()
            })?;

        Ok(transactions.iter().map(|op| op.amount).sum())
    }
}

pub fn build_engine(path: &std::path::PathBuf) -> rhai::Engine {
    let mut engine = rhai::Engine::new();

    rhai_http::HttpPackage::new().register_into_engine(&mut engine);
    engine.register_static_module("env", rhai::exported_module!(env).into());
    engine.register_global_module(rhai::exported_module!(prelude).into());
    engine.register_global_module(rhai::exported_module!(time_helper).into());
    engine.build_type::<TransactionRhai>();
    engine.set_module_resolver(rhai::module_resolvers::FileModuleResolver::new_with_path(
        path.parent().expect("should have a parent"),
    ));

    engine
}
