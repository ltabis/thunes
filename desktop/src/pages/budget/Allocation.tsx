import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
  TextField,
} from "@mui/material";
import { useState } from "react";
import {
  addBudgetAllocation,
  deleteBudgetAllocation,
  EMPTY_RECORD_ID,
  RecordId,
  updateBudgetAllocation,
} from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { Allocation } from "../../../../cli/bindings/Allocation";
import { filterFloat } from "../../utils";
import CategorySelector from "../../components/form/CategorySelector";
import { Budget } from "../../../../cli/bindings/Budget";
import PartitionSelector from "../../components/form/PartitionSelector";

export function AddAllocationDrawer({
  budget,
  close,
  onUpdate,
}: {
  budget: Budget;
  close: () => void;
  onUpdate: (budget: Budget) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;

  const [form, setForm] = useState<
    Omit<Allocation, "amount" | "category" | "id"> & {
      amount: string;
      category: RecordId;
      partition: RecordId;
    }
  >({
    amount: "0",
    category: EMPTY_RECORD_ID,
    partition: EMPTY_RECORD_ID,
  });

  const handleCloseForm = () => {
    close();
  };

  const handleValidAmount = () => isNaN(filterFloat(form.amount));

  const handlePartitionSubmission = async () => {
    const amount = filterFloat(form.amount);
    const category =
      form.category !== EMPTY_RECORD_ID ? form.category : undefined;

    addBudgetAllocation({
      amount,
      category,
      partition: form.partition,
    })
      .then((budget) => {
        handleCloseForm();
        onUpdate(budget);
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Drawer open={true} onClose={handleCloseForm} anchor="right">
      <DialogTitle>Add Allocation</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <CategorySelector
            category={form.category}
            onChange={(category) =>
              setForm({
                ...form,
                category,
              })
            }
          />
          <TextField
            id="allocation-amount"
            label="Amount"
            name="amount"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            value={form.amount}
            onChange={(amount) =>
              setForm({ ...form, amount: amount.target.value })
            }
            error={handleValidAmount()}
            helperText={handleValidAmount() && "Not a valid amount"}
          />
          <PartitionSelector
            budget={budget}
            partition={form.partition}
            onChange={(partition) => setForm({ ...form, partition })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={handleValidAmount()}
          onClick={handlePartitionSubmission}
        >
          Create
        </Button>
      </DialogActions>
    </Drawer>
  );
}

export function EditAllocationDrawer({
  budget,
  allocation,
  close,
  onUpdate,
}: {
  budget: Budget;
  allocation: Allocation;
  close: () => void;
  onUpdate: (allocation: Allocation) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [form, setForm] = useState<
    Omit<Allocation, "amount" | "category"> & {
      amount: string;
      category: RecordId;
    }
  >({
    ...allocation,
    amount: allocation.amount.toString(),
    category: allocation.category.id,
  });

  const handleCloseForm = () => {
    close();
  };

  const handleValidAmount = () => isNaN(filterFloat(form.amount));

  const handleAllocationSubmission = async () => {
    const amount = filterFloat(form.amount);

    updateBudgetAllocation({
      ...form,
      amount,
    })
      .then((allocation) => {
        onUpdate(allocation);
        handleCloseForm();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  const handleAllocationDelete = async () => {
    deleteBudgetAllocation(allocation.id)
      .then(() => {
        onUpdate(allocation);
        handleCloseForm();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Drawer open={true} onClose={handleCloseForm} anchor="right">
      <DialogTitle>Update Allocation</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <CategorySelector
            category={form.category}
            onChange={(category) =>
              setForm({
                ...form,
                category,
              })
            }
          />
          <TextField
            id="allocation-amount"
            label="Amount"
            name="amount"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            value={form.amount}
            onChange={(amount) =>
              setForm({ ...form, amount: amount.target.value })
            }
            error={handleValidAmount()}
            helperText={handleValidAmount() && "Not a valid amount"}
          />

          <PartitionSelector
            budget={budget}
            partition={form.partition}
            onChange={(partition) =>
              setForm({
                ...form,
                partition,
              })
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAllocationSubmission}>Update</Button>
        <Button onClick={handleAllocationDelete} color="error">
          Delete
        </Button>
      </DialogActions>
    </Drawer>
  );
}
