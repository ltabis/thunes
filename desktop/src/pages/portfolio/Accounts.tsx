import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
} from "@mui/material";
import { useState } from "react";
import { CurrencyTile } from "../../../../cli/bindings/CurrencyTile";
import { PieChart } from "@mui/x-charts";
import { useAccountNavigate } from "../../hooks/accounts";
import CurrencySelector from "../../components/form/CurrencySelector";
import { getCurrency } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";

export function RenderTile({ tile }: { tile: CurrencyTile }) {
  const navigate = useAccountNavigate();

  switch (tile.t) {
    case "Pie":
      return (
        <PieChart
          width={400}
          height={300}
          hideLegend={true}
          series={[
            {
              data: tile.data.accounts.map(({ account, balance }) => ({
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
                `${item.value.toFixed(2)} ${tile.data.currency}`,
            },
          ]}
          onItemClick={(_event, account) => {
            const currentAccount =
              tile.data.accounts[account.dataIndex].account;
            navigate(currentAccount);
          }}
        />
      );
  }
}

export function AddTile({
  close,
  onCreate,
}: {
  close: () => void;
  onCreate: (tile: CurrencyTile) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;

  const [form, setForm] = useState<
    Omit<CurrencyTile, "data"> & { currency?: string }
  >({ t: "Pie" });

  const handleCloseForm = () => {
    close();
  };

  const handleTileSubmission = async () => {
    getCurrency({ name: form.currency! })
      .then((data) => {
        onCreate({
          ...form,
          data,
        });
        close();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
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
