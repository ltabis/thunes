import {
  Button,
  Card,
  CardContent,
  CardHeader,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { CurrencyTile } from "../../../../cli/bindings/CurrencyTile";
import { PieChart } from "@mui/x-charts";
import { useAccountNavigate } from "../../hooks/accounts";
import CurrencySelector from "../../components/form/CurrencySelector";
import { getCurrency } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { Currency } from "../../../../cli/bindings/Currency";
import { ClearIcon } from "@mui/x-date-pickers";

export function RenderTile({
  tile,
  onRemove,
}: {
  tile: CurrencyTile;
  onRemove: () => void;
}) {
  const navigate = useAccountNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [data, setData] = useState<Currency>();

  useEffect(() => {
    getCurrency({ name: tile.currency })
      .then(setData)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [tile.currency, dispatchSnackbar]);

  // FIXME: add skeleton.
  if (!data) return;

  let chart = <></>;

  switch (tile.t) {
    case "Pie":
      chart = (
        <PieChart
          width={400}
          height={300}
          hideLegend={true}
          series={[
            {
              data: data.accounts.map(({ account, balance }) => ({
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
                `${item.value.toFixed(2)} ${data.currency}`,
            },
          ]}
          onItemClick={(_event, account) => {
            const currentAccount = data.accounts[account.dataIndex].account;
            navigate(currentAccount);
          }}
        />
      );
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title={data.currency}
        subheader="accounts"
        action={
          <Stack direction="row" alignItems="center">
            <Typography variant="subtitle1">
              {data.total_balance.toFixed(2)} {data.currency}
            </Typography>
            <IconButton onClick={() => onRemove()}>
              <ClearIcon />
            </IconButton>
          </Stack>
        }
      />
      <CardContent>{chart}</CardContent>
    </Card>
  );
}

export function AddTile({
  close,
  onCreate,
}: {
  close: () => void;
  onCreate: (tile: CurrencyTile) => void;
}) {
  const [form, setForm] = useState<
    Omit<CurrencyTile, "currency"> & { currency?: string }
  >({
    t: "Pie",
  });

  const handleCloseForm = () => {
    close();
  };

  const handleTileSubmission = async () => {
    const currency = form.currency!;
    onCreate({ ...form, currency });
    close();
  };

  const verifyForm = () => {
    return form.currency === undefined;
  };

  return (
    <Drawer open={true} onClose={handleCloseForm} anchor="right">
      <DialogTitle>Add Account tile</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <CurrencySelector
            label="Currency"
            currency={form.currency ?? null}
            onChange={(currency) =>
              setForm({ ...form, currency: currency ?? undefined })
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={verifyForm()} onClick={handleTileSubmission}>
          Create
        </Button>
      </DialogActions>
    </Drawer>
  );
}
