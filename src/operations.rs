use std::str::FromStr;

const TIME_FORMAT: &[time::format_description::FormatItem<'_>] =
    time_macros::format_description!("[year]-[month]-[day]");

#[derive(Debug)]
pub struct Item {
    pub date: time::Date,
    pub ammount: f64,
    pub description: String,
    pub tags: std::collections::HashSet<String>,
}

#[derive(Debug)]
pub enum Operation {
    Income(Item),
    Spending(Item),
}

impl FromStr for Operation {
    type Err = String;

    // TODO: terrible error handling.
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut items = s.split(',');
        let date = items.next().ok_or("Date field not found".to_string())?;
        let date = time::Date::parse(date, TIME_FORMAT)
            .map_err(|err| format!("failed to parse date '{date}': {err}"))?;

        let operation = items
            .next()
            .ok_or("Operation field not found".to_string())?;
        let ammount = f64::from_str(items.next().ok_or("Ammount field not found".to_string())?)
            .map_err(|_| "Ammount field is not a float".to_string())?;
        let description = items
            .next()
            .ok_or("Description field not found".to_string())?
            .to_string();
        let tags = items
            .next()
            .ok_or("Tags field not found".to_string())?
            .to_string()
            .split(':')
            .map(|s| s.to_string())
            .collect::<std::collections::HashSet<_>>();

        match operation {
            "i" => Ok(Self::Income(Item {
                date,
                ammount,
                description,
                tags,
            })),
            "s" => Ok(Self::Spending(Item {
                date,
                ammount,
                description,
                tags,
            })),
            op => Err(format!("Operation '{op}' not recognized")),
        }
    }
}

impl std::fmt::Display for Operation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let item = match self {
            Operation::Spending(i) | Operation::Income(i) => i,
        };

        write!(
            f,
            "{},{},{},{},{}\n",
            item.date
                .format(TIME_FORMAT)
                .expect("formatting should be valid"),
            self.as_str(),
            item.ammount,
            item.description,
            item.tags
                .iter()
                .map(|s| s.as_str())
                .collect::<Vec<&str>>()
                .join(":")
        )
    }
}

impl Operation {
    pub fn as_str(&self) -> &str {
        match self {
            Operation::Income(_) => "i",
            Operation::Spending(_) => "s",
        }
    }

    pub fn date(&self) -> time::Date {
        match self {
            Operation::Income(item) | Operation::Spending(item) => item.date,
        }
    }

    pub fn ammount(&self) -> f64 {
        match self {
            Operation::Income(item) => item.ammount,
            Operation::Spending(item) => -item.ammount,
        }
    }
}
