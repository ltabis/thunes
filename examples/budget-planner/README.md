# Budget planner example

This example uses a custom Rhai script to split your monthly budget into 3 categories whit their own allocations,
based on the [50/30/20 rule](https://www.unfcu.org/financial-wellness/50-30-20-rule/).

```sh
# Check the account balance and spending per category using the script.
accounting --accounts ./accounts balance -s ./scripts/budget-planner.rhai
```
