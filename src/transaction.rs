const TIME_FORMAT: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]-[month]-[day]");

#[derive(Debug)]
pub enum Error {
    ParsingFieldNotFound(String),
    ParsingFieldFailed {
        field: String,
        error: Box<dyn std::error::Error>,
    },
    InvalidOperation(String),
    Serialize(serde_json::Error),
    Deserialize(serde_json::Error),
}

/// Information common to all operations types.
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Item {
    pub date: time::Date,
    pub ammount: f64,
    pub description: String,
    pub tags: std::collections::HashSet<String>,
}

/// Type of operations on an account.
#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(tag = "operation", rename_all = "kebab-case")]
pub enum Transaction {
    /// Add currency to an account.
    Income(Item),
    /// Substract currency from an account.
    Spending(Item),
}

impl Transaction {
    pub fn from_json(json: &str) -> Result<Self, Error> {
        serde_json::from_str(json).map_err(Error::Serialize)
    }

    // TODO: impl de/serialize from multiple data types.
    // TODO: use bincode ?
    pub fn write_to_json<H>(&self, writter: H) -> Result<(), Error>
    where
        H: std::io::Write,
    {
        serde_json::to_writer(writter, self).map_err(Error::Serialize)
    }

    pub fn as_str(&self) -> &str {
        match self {
            Self::Income(_) => "i",
            Self::Spending(_) => "s",
        }
    }

    pub fn date(&self) -> time::Date {
        match self {
            Self::Income(item) | Self::Spending(item) => item.date,
        }
    }

    pub fn ammount(&self) -> f64 {
        match self {
            Self::Income(item) => item.ammount,
            Self::Spending(item) => -item.ammount,
        }
    }
}

// macro_rules! get_field {
//     ($items:expr, $field:expr) => {
//         $items
//             .next()
//             .ok_or(Self::Err::ParsingFieldNotFound($field.to_string()))
//     };
// }

// impl FromStr for Operation {
//     type Err = Error;

//     fn from_str(s: &str) -> Result<Self, Self::Err> {
//         let mut items = s.split(',');
//         let date = get_field!(items, "date")?;
//         let date = time::Date::parse(date, TIME_FORMAT).map_err(|error| {
//             Self::Err::ParsingFieldFailed {
//                 field: "date".to_string(),
//                 error: Box::new(error),
//             }
//         })?;

//         let operation = get_field!(items, "operation")?;
//         let ammount = f64::from_str(get_field!(items, "ammount")?).map_err(|error| {
//             Self::Err::ParsingFieldFailed {
//                 field: "ammount".to_string(),
//                 error: Box::new(error),
//             }
//         })?;

//         let description = get_field!(items, "description")?.to_string();
//         let tags = get_field!(items, "tags")?
//             .to_string()
//             .split(':')
//             .map(|s| s.to_string())
//             .collect::<std::collections::HashSet<_>>();

//         match operation {
//             "i" => Ok(Self::Income(Item {
//                 date,
//                 ammount,
//                 description,
//                 tags,
//             })),
//             "s" => Ok(Self::Spending(Item {
//                 date,
//                 ammount,
//                 description,
//                 tags,
//             })),
//             op => Err(Self::Err::InvalidOperation(op.to_string())),
//         }
//     }
// }

// impl std::fmt::Display for Operation {
//     fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
//         let item = match self {
//             Operation::Spending(i) | Operation::Income(i) => i,
//         };

//         write!(
//             f,
//             "{},{},{},{},{}\n",
//             item.date.format(TIME_FORMAT).expect("time format is valid"),
//             self.as_str(),
//             item.ammount,
//             item.description,
//             item.tags
//                 .iter()
//                 .map(|s| s.as_str())
//                 .collect::<Vec<&str>>()
//                 .join(":")
//         )
//     }
// }
