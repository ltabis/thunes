import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";
import { CreateSplitBudgetOptions } from "../../../cli/bindings/CreateSplitBudgetOptions";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { useBudgetNavigate } from "../hooks/budget";
import { filterFloat } from "../utils";

import { Account } from "../../../cli/bindings/Account";

import { useAccountStore } from "../stores/account";
import { useBudgetStore } from "../stores/budget";
import Page from "./Page";

function AddCurrencyDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const navigate = useBudgetNavigate();
  const budgetStore = useBudgetStore();
  const accountStore = useAccountStore();
  const dispatchSnackbar = useDispatchSnackbar()!;

  const [form, setForm] = useState<
    Omit<CreateSplitBudgetOptions, "income" | "accounts"> & {
      income: string;
      accounts: AccountIdentifiers[];
    }
  >({
    name: "",
    income: "0",
    currency: "",
    accounts: [],
  });

  // FIXME: filter using the backend.
  const filterAccountByCurrency = (
    accounts: Map<string, Account>,
    currency: string
  ) =>
    Array.from(accounts.values()).filter(
      (account) => account.currency === currency
    );

  const handleCloseForm = () => {
    setOpen(false);
  };

  const handleValidAmount = () => isNaN(filterFloat(form.income));

  const handleBudgetSubmission = async () => {
    const income = filterFloat(form.income);
    const accounts = form.accounts.map((account) => account.id);

    budgetStore
      .create({
        ...form,
        income,
        accounts,
      })
      .then((budget) => {
        handleCloseForm();
        navigate({ id: budget.id, name: budget.name });
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseForm}
      slotProps={{
        paper: {
          component: "form",
          onSubmit: async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            return handleBudgetSubmission();
          },
        },
      }}
    >
      <DialogTitle>Add budget</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ margin: 1 }}>
          <Grid size={5}>
            <TextField
              id="budget-name"
              label="Name"
              name="name"
              value={form.name}
              onChange={(name) => setForm({ ...form, name: name.target.value })}
            />
          </Grid>
          <Grid size={3}>
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
              error={handleValidAmount()}
              helperText={handleValidAmount() && "Not a valid amount"}
            />
          </Grid>
        </Grid>
        {
          <Grid container spacing={2} sx={{ margin: 1 }}>
            <Grid size={5}>
              <InputLabel>Currency</InputLabel>
              <Select
                value={form.currency}
                label="Currency"
                onChange={(currency) =>
                  setForm({ ...form, currency: currency.target.value })
                }
              >
                {accountStore.getCurrencies().map((currency, id) => (
                  <MenuItem key={`${currency}-${id}`} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </Select>
            </Grid>

            <Grid size={5}>
              {form.currency !== "" && (
                <Autocomplete
                  multiple
                  selectOnFocus
                  handleHomeEndKeys
                  clearOnBlur
                  disablePortal
                  disableCloseOnSelect
                  value={form.accounts}
                  options={
                    accountStore.accounts
                      ? filterAccountByCurrency(
                          accountStore.accounts,
                          form.currency
                        )
                      : []
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
            </Grid>
          </Grid>
        }
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseForm}>Cancel</Button>
        <Button
          disabled={
            form.income === "0" ||
            form.name === "" ||
            form.accounts.length === 0
          }
          type="submit"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export default function () {
  return (
    <Page
      toolbarStart={<Typography variant="h4">Currencies</Typography>}
      actions={[]}
    >
      <p>Empty</p>
    </Page>
  );
}
