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
import { useEffect, useState } from "react";
import {
  deleteBudget,
  getBudget,
  listAccountsWithDetails,
  RecordId,
  updateBudget,
} from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { BudgetIdentifiers } from "../../../../cli/bindings/BudgetIdentifiers";
import { useBudgetNavigate } from "../../hooks/budget";
import { filterFloat } from "../../utils";
import { Account } from "../../../../cli/bindings/Account";

function DeleteBudgetDialog({
  budget,
  onClose,
  onChange,
}: {
  budget: BudgetIdentifiers;
  onClose: () => void;
  onChange: (budget: RecordId) => void;
}) {
  const navigate = useBudgetNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;

  const handleDeleteBudget = async () => {
    deleteBudget(budget.id)
      .then(() => {
        onClose();
        onChange(budget.id);
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
  onChange,
}: {
  budget: RecordId;
  onClose: () => void;
  onChange: (budget: RecordId) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>();
  const [form, setForm] = useState<
    Omit<Budget, "income"> & { income: string }
  >();

  const handleSettingsUpdate = (
    form: Omit<Budget, "income"> & { income: string }
  ) => {
    const income = filterFloat(form.income);

    const budget = {
      ...form,
      income,
    };
    updateBudget(budget).catch((error) =>
      dispatchSnackbar({ type: "open", severity: "error", message: error })
    );
    onChange(budget.id);
    onClose();
  };

  const handleValidAmount = (income: string) => isNaN(filterFloat(income));

  const getCurrencies = (accounts: Account[]) =>
    Array.from(new Set(accounts.map((account) => account.currency)).values());

  const filterAccountByCurrency = (accounts: Account[], currency: string) =>
    accounts.filter((account) => account.currency === currency);

  useEffect(() => {
    getBudget(budget)
      .then((budget) =>
        setForm({
          ...budget,
          income: budget.income.toString(),
        })
      )
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
    listAccountsWithDetails()
      .then(setAccounts)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [budget, dispatchSnackbar]);

  if (!form || !accounts) return <></>;

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
            {getCurrencies(accounts).map((currency, id) => (
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
              options={
                accounts ? filterAccountByCurrency(accounts, form.currency) : []
              }
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
        <DeleteBudgetDialog
          budget={{ id: form.id, name: form.name }}
          onClose={() => setDeleteDialog(false)}
          onChange={onChange}
        />
      )}
    </Drawer>
  );
}
