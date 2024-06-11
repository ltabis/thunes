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
pub mod prelude {
    /// Sum the total of the given transaction array.
    ///
    /// rhai-autodocs:index:2
    #[rhai_fn(return_raw)]
    pub fn sum(transactions: &mut rhai::Array) -> Result<rhai::FLOAT, Box<rhai::EvalAltResult>> {
        let transactions = transactions
            .iter()
            .map(rhai::serde::from_dynamic)
            .collect::<Result<Vec<TransactionRhai>, _>>()?;

        Ok(transactions.iter().map(|op| op.amount).sum())
    }
}

pub fn build_engine() -> rhai::Engine {
    let mut engine = rhai::Engine::new();

    rhai_http::HttpPackage::new().register_into_engine(&mut engine);
    engine.register_static_module("env", rhai::exported_module!(env).into());
    engine.register_global_module(rhai::exported_module!(prelude).into());
    engine.register_type::<TransactionRhai>();

    engine
}
