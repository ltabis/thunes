pub mod account;
pub mod script;
pub mod transaction;

pub const TIME_FORMAT: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]-[month]-[day]");
pub const TIME_FORMAT_MONTH: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[month]");
pub const TIME_FORMAT_YEAR: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]");
pub const TIME_FORMAT_DAY: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[day]");
