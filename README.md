# Thunes

> [!WARNING]
> This repository is being rewritten as a desktop app using Tauri.

A desktop app to register and analyze transactions.

## Why ?

I wanted a tool that I could use to manage my own accounting using a simple text format.

## How to use

```sh
# Create a new account.
accounting new --name main --currency EUR

# Record an income.
accounting --accounts ~/my-accounts income --account main \
 --amount "2000" --description "Salary" --tags=job

# Record an expense.
accounting --accounts ~/my-accounts spend --account main \
 --amount "15" --description "Train tickets" --tags=transport

# Display the overall balance of all your accounts.
accounting --accounts ~/my-accounts balance
```

## Rhai integration

[Rhai scripts](https://rhai.rs/) can be used to customize how the program computes the balance of accounts. They can be useful to, for example, convert the balance of an account into another currency,
or aggregate multiple balances together.
See the example folder for more details.
