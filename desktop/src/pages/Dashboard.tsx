import {
  Box,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { PieChart } from "@mui/x-charts";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { CurrencyBalance } from "../../../cli/bindings/CurrencyBalance";
import Grid from "@mui/material/Grid2";

export default function Dashboard() {
  const [currencies, setCurrencies] = useState<CurrencyBalance[] | null>(null);

  const getBalances = async () =>
    invoke("get_all_balance")
      .then((balances) => setCurrencies(balances as CurrencyBalance[]))
      .catch((error) => console.error("failed to get balances", error));

  useEffect(() => {
    getBalances();
  }, []);

  return (
    <Paper elevation={0} sx={{ height: "100%" }}>
      {/* TODO: Go to account on click */}
      <Typography variant="h2" sx={{ m: 2 }}>
        Overview
      </Typography>

      <Divider></Divider>

      {currencies ? (
        <Grid container spacing={2} sx={{ m: 2 }}>
          {currencies.map(({ currency, accounts }) => (
            <Box key={currency} flexGrow={1}>
              <Typography variant="h4">{currency}</Typography>
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
              />
            </Box>
          ))}
        </Grid>
      ) : (
        <Skeleton animation="wave" variant="circular" />
      )}
    </Paper>
  );
}
