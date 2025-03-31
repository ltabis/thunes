import { MuiColorInput } from "mui-color-input";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { useState } from "react";
import { Budget } from "../../../../cli/bindings/Budget";
import { addBudgetPartition, updateBudgetPartition } from "../../api";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
  TextField,
} from "@mui/material";
import { Partition } from "../../../../cli/bindings/Partition";

export function AddPartitionDrawer({
  budget,
  close,
  onUpdate,
}: {
  budget: Budget;
  close: () => void;
  onUpdate: (partition: Partition) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [form, setForm] = useState<Omit<Partition, "id">>({
    name: "",
    color: "white",
    budget: budget.id,
  });

  const handleCloseForm = () => {
    close();
  };

  const handlePartitionSubmission = async () => {
    addBudgetPartition(budget.id, form)
      .then((partition) => {
        onUpdate(partition);
        handleCloseForm();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Drawer open={true} onClose={handleCloseForm} anchor="right">
      <DialogTitle>Add Partition</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            id="partition-name"
            label="Name"
            name="name"
            value={form.name}
            onChange={(name) => setForm({ ...form, name: name.target.value })}
          />
          <MuiColorInput
            format="hex"
            value={form.color}
            onChange={(color) => setForm({ ...form, color })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handlePartitionSubmission}>Add</Button>
      </DialogActions>
    </Drawer>
  );
}

export function EditPartitionDrawer({
  partition,
  close,
  onUpdate,
}: {
  partition: Partition;
  close: () => void;
  onUpdate: (budget: Partition) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [form, setForm] = useState<Partition>(partition);

  const handleCloseForm = () => {
    close();
  };

  const handlePartitionSubmission = async () => {
    updateBudgetPartition(form)
      .then((partition) => {
        onUpdate(partition);
        handleCloseForm();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Drawer open={true} onClose={handleCloseForm} anchor="right">
      <DialogTitle>Update Partition</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            id="partition-name"
            label="Name"
            name="name"
            value={form.name}
            onChange={(name) => setForm({ ...form, name: name.target.value })}
          />
          <MuiColorInput
            format="hex"
            value={form.color}
            onChange={(color) => setForm({ ...form, color })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handlePartitionSubmission}>Update</Button>
      </DialogActions>
    </Drawer>
  );
}
