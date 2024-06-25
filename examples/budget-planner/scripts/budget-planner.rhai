//! This scripts searches trought transactions tags to display detailed allocations to the 50/30/20 budget rule.

fn on_main(transactions) {
    let categories = #{
        "needs": #{ name: "needs", percentage: 0.5, total: 0 },
        "wants": #{ name: "wants", percentage: 0.3, total: 0 },
        "savings": #{ name: "savings", percentage: 0.2, total: 0 },
    };

    let start_of_month = new_date(`${year()}-${month()}-01`);
    let current_month_start_index = transactions.index_of(|t| t.date >= start_of_month);

    let initial_balance = if current_month_start_index == 0 {
            0
        } else {
            sum(transactions.extract(0..current_month_start_index))
        };

    let transactions_after_month = transactions.extract(current_month_start_index..);
    let remaining_balance = 0;

    // Sum transactions per budget categories.
    for t in transactions_after_month {
        let cat = t.tags.find(|tag| tag in categories.keys());

        if cat != () {
            categories[cat].total += t.amount;
        }

        remaining_balance += t.amount;
    }

    // Display total budget spent per category and a warning if the category speding total exceeds the budget allocation.
    print(`main account budget for ${year()}-${month()}:`);
    for cat in categories.values() {
        let cat_total = cat.total * -1; // category expenses are always negative.
        let cat_maximum_expenses = initial_balance * cat.percentage;
        let cat_percentage = initial_balance / cat_total;

        if cat_total > cat_maximum_expenses {
            print(`- ${cat.name}: ${cat_total} EUR (WARNING, expenses exceeds budget allocation for category: maximum is ${cat_maximum_expenses} EUR)`);
        } else if cat_total == cat_maximum_expenses {
            print(`- ${cat.name}: ${cat_total} EUR (Maximum budget reached for category)`);
        } else {
            print(`- ${cat.name}: ${cat_total} EUR`);
        }
    }

    #{
        "currency": "EUR",
        "amount": initial_balance + remaining_balance
    }
}