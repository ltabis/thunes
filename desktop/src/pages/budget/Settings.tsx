import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Budget } from "../../../../cli/bindings/Budget";
import { useState } from "react";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { useBudgetNavigate } from "../../hooks/budget";
import { filterFloat } from "../../utils";
import { useBudgetStore } from "../../stores/budget";
import { useAccountStore } from "../../stores/account";

function DeleteBudgetDialog({
  budget,
  onClose,
}: {
  budget: Budget;
  onClose: () => void;
}) {
  const navigate = useBudgetNavigate();
  const store = useBudgetStore();
  const dispatchSnackbar = useDispatchSnackbar()!;

  const handleDeleteBudget = async () => {
    store
      .delete(budget)
      .then(() => {
        onClose();
        navigate();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>
        Are you sure you want to delete the {budget.name} budget ?
      </DialogTitle>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleDeleteBudget}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ({
  budget,
  onClose,
}: {
  budget: Budget;
  onClose: () => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const budgetStore = useBudgetStore()!;
  const accountStore = useAccountStore()!;
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState<Omit<Budget, "income"> & { income: string }>(
    { ...budget, income: budget.income.toString() }
  );

  const handleSettingsUpdate = (
    form: Omit<Budget, "income"> & { income: string }
  ) => {
    const income = filterFloat(form.income);

    const budget = {
      ...form,
      income,
    };

    budgetStore
      .update(budget)
      .then(() => onClose())
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  const handleValidAmount = (income: string) => isNaN(filterFloat(income));

  if (!form) return <></>;

  return (
    <Drawer open={true} onClose={() => onClose()} anchor="right">
      <DialogTitle>Update budget settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            id="name"
            label="Title"
            variant="outlined"
            value={form.name}
            onChange={(name) =>
              setForm({
                ...form,
                name: name.target.value,
              })
            }
          />
          <TextField
            id="currency"
            label="Currency"
            variant="outlined"
            value={form.currency}
            onChange={(currency) =>
              setForm({
                ...form,
                currency: currency.target.value,
              })
            }
          />
          <TextField
            id="budget-income"
            label="Income"
            name="income"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            value={form.income}
            onChange={(income) =>
              setForm({ ...form, income: income.target.value })
            }
            error={handleValidAmount(form.income)}
            helperText={handleValidAmount(form.income) && "Not a valid amount"}
          />
          <InputLabel>Currency</InputLabel>
          <Select
            value={form.currency}
            label="Currency"
            onChange={(currency) =>
              setForm({
                ...form,
                currency: currency.target.value,
                accounts: [],
              })
            }
          >
            {accountStore.getCurrencies().map((currency, id) => (
              <MenuItem key={`${currency}-${id}`} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </Select>

          {form.currency !== "" && (
            <Autocomplete
              sx={{ width: 300 }}
              multiple
              selectOnFocus
              handleHomeEndKeys
              clearOnBlur
              disablePortal
              disableCloseOnSelect
              value={form.accounts}
              options={accountStore.filterByCurrency(form.currency)}
              getOptionLabel={(account) => account.name}
              renderInput={(params) => (
                <TextField {...params} label="Accounts" />
              )}
              renderOption={(props, option) => {
                const { key, id, ...optionProps } = props;
                return (
                  <MenuItem
                    key={`${key}-${id}`}
                    value={option.name}
                    {...optionProps}
                  >
                    <Chip label={option.name} />
                  </MenuItem>
                );
              }}
              onChange={(_event, newAccounts) =>
                setForm({ ...form, accounts: newAccounts })
              }
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialog(true)} color="error">
          Delete
        </Button>
        <Button onClick={() => handleSettingsUpdate(form)}>Update</Button>
      </DialogActions>

      {deleteDialog && (
        // FIXME: delete dialogs could be refactored into a component.
        <DeleteBudgetDialog
          budget={budget}
          onClose={() => setDeleteDialog(false)}
        />
      )}
    </Drawer>
  );
}
