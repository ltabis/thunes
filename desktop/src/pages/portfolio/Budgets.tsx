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
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getBudgetExpenses } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { BudgetTile } from "../../../../cli/bindings/BudgetTile";
import BudgetPie from "../budget/Pie";
import { ReadExpensesResult } from "../../../../cli/bindings/ReadExpensesResult";
import BudgetSelector from "../../components/form/BudgetSelector";
import { BudgetIdentifiers } from "../../../../cli/bindings/BudgetIdentifiers";
import { ClearIcon } from "@mui/x-date-pickers";
import { useBudgetNavigate } from "../../hooks/budget";

export function RenderTile({
  tile,
  onRemove,
}: {
  tile: BudgetTile;
  onRemove: () => void;
}) {
  const navigate = useBudgetNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [data, setData] = useState<ReadExpensesResult>();

  useEffect(() => {
    getBudgetExpenses(
      // FIXME: do not use a raw string for the id.
      //        See portfolio/budget.rs
      { tb: "budget", id: { String: tile.budget } },
      {
        period: "Monthly",
        period_index: 0,
      }
    )
      .then(setData)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [tile.budget, dispatchSnackbar]);

  if (!data) return <Skeleton animation="wave" />;

  let chart = <></>;

  switch (tile.t) {
    case "Pie":
      chart = (
        <BudgetPie
          key={data.budget.inner.name}
          budget={data.budget.inner.id}
          width={400}
          height={300}
          onClick={() =>
            navigate({
              name: "",
              id: { id: { String: tile.budget }, tb: "budget" },
            })
          }
        />
      );
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title={data.budget.inner.name}
        subheader="budget"
        action={
          <Stack direction="row" alignItems="center">
            <Typography variant="subtitle1">
              {data.budget.transactions_total.toFixed(2)}{" "}
              {data.budget.inner.currency}
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

export function AddBudget({
  close,
  onCreate,
}: {
  close: () => void;
  onCreate: (tile: BudgetTile) => void;
}) {
  const [form, setForm] = useState<
    Omit<BudgetTile, "budget"> & { budget: BudgetIdentifiers | null }
  >({
    t: "Pie",
    budget: null,
  });

  const handleCloseForm = () => {
    close();
  };

  const handleTileSubmission = async () => {
    const budget = form.budget!.id.id.String;
    onCreate({ ...form, budget });
    close();
  };

  const verifyForm = () => {
    return form.budget === undefined;
  };

  return (
    <Drawer open={true} onClose={handleCloseForm} anchor="right">
      <DialogTitle>Add Budget tile</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <BudgetSelector
            budget={form.budget}
            onChange={(budget) => setForm({ ...form, budget })}
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
