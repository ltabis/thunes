import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import { PieChart } from "@mui/x-charts";
import { useEffect, useState } from "react";
import { CurrencyBalance } from "../../../cli/bindings/CurrencyBalance";
import Grid from "@mui/material/Grid2";
import { useNavigate } from "react-router-dom";
import { getAllBalance } from "../api";
import { useDispatchSnackbar } from "../contexts/Snackbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [currencies, setCurrencies] = useState<CurrencyBalance[] | null>(null);

  useEffect(() => {
    getAllBalance()
      .then(setCurrencies)
      .catch((error) => dispatchSnackbar({ type: "open", severity: "error", message: error }));
  }, [dispatchSnackbar]);

  return (
    <Paper elevation={0} sx={{ height: "100%" }}>
      <Typography variant="h2" sx={{ m: 2 }}>
        Portfolio
      </Typography>

      <Divider></Divider>

      {currencies ? (
        <Grid container spacing={2} sx={{ m: 2 }}>
          {currencies.map(({ total_balance, currency, accounts }) => (
            <Card key={currency} variant="outlined">
              <CardHeader
                title={currency}
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
                  slotProps={{
                    legend: { hidden: true },
                  }}
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
                    navigate(`/account/${currentAccount.id}`);
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </Grid>
      ) : (
        <Skeleton animation="wave" variant="circular" />
      )}
    </Paper>
  );
}
