FOR $budget IN (SELECT accounts.id as accounts, id FROM budget GROUP BY id) {
    UPDATE $budget.id SET accounts = $budget.accounts
};

UPDATE account SET filter = {
    search: null,
    category: null,
    start: null,
    end: null,
    last_x_days: null,
};

UPDATE account UNSET transaction_grid_sort_model;