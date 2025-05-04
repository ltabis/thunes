import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Paper,
  Skeleton,
  Typography,
  Grid,
} from "@mui/material";
import { PieChart } from "@mui/x-charts";
import { useEffect, useState } from "react";
import { CurrencyBalance } from "../../../cli/bindings/CurrencyBalance";
import { getAllBalance, getBudgetExpenses, listBudgets } from "../api";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { useAccountNavigate } from "../hooks/accounts";
import { ExpensesBudget } from "../../../cli/bindings/ExpensesBudget";
import BudgetPie from "./budget/Pie";

export default function Dashboard() {
  const navigate = useAccountNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;
  // FIXME: Find a better name than "currencies".
  const [currencies, setCurrencies] = useState<CurrencyBalance[] | null>(null);
  const [budgets, setBudgets] = useState<ExpensesBudget[] | null>(null);

  useEffect(() => {
    getAllBalance()
      .then(setCurrencies)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );

    async function getBudgets() {
      try {
        const results = [];
        const budgets = await listBudgets();
        for (const budget of budgets) {
          results.push(
            (
              await getBudgetExpenses(budget.id, {
                period: "Monthly",
                period_index: 0,
              })
            ).budget
          );
        }
        setBudgets(results);
      } catch (error) {
        dispatchSnackbar({
          type: "open",
          severity: "error",
          message: error as string,
        });
      }
    }

    getBudgets();
  }, [dispatchSnackbar]);

  return (
    <Paper
      elevation={0}
      sx={{ height: "100%", maxHeight: "100%", overflow: "scroll" }}
    >
      <Typography variant="h2" sx={{ m: 2 }}>
        Portfolio
      </Typography>

      <Divider />

      <Grid container spacing={2} sx={{ m: 2 }}>
        {currencies ? (
          currencies.map(({ total_balance, currency, accounts }) => (
            <Card key={currency} variant="outlined">
              <CardHeader
                title={currency}
                subheader="accounts"
                action={
                  <Typography variant="subtitle1">
                    {total_balance.toFixed(2)} {currency}
                  </Typography>
                }
              />
              <CardContent>
                <PieChart
                  width={400}
                  height={300}
                  hideLegend={true}
                  series={[
                    {
                      data: accounts.map(({ account, balance }) => ({
                        value: balance,
                        label: account.name,
                      })),
                      innerRadius: 30,
                      outerRadius: 100,
                      paddingAngle: 5,
                      cornerRadius: 5,
                      arcLabelMinAngle: 35,
                      arcLabel: (item) => item.label ?? "",
                      valueFormatter: (item) =>
                        `${item.value.toFixed(2)} ${currency}`,
                    },
                  ]}
                  onItemClick={(_event, account) => {
                    const currentAccount = accounts[account.dataIndex].account;
                    navigate(currentAccount);
                  }}
                />
              </CardContent>
            </Card>
          ))
        ) : (
          <Skeleton animation="wave" variant="circular" />
        )}

        {budgets ? (
          budgets.map(({ inner, total }) => (
            <Card key={inner.id.id.String} variant="outlined">
              <CardHeader
                title={inner.name}
                subheader="budget"
                action={
                  <Typography variant="subtitle1">
                    {total.toFixed(2)} {inner.currency}
                  </Typography>
                }
              />
              <CardContent>
                <BudgetPie
                  options={{ expenses: false, allocations: false }}
                  key={inner.name}
                  budget={inner.id}
                  width={500}
                />
              </CardContent>
            </Card>
          ))
        ) : (
          <Skeleton animation="wave" variant="circular" />
        )}
      </Grid>
    </Paper>
  );
}
