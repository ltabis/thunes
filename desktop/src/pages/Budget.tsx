import {
  Alert,
  AppBar,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  SnackbarCloseReason,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { MouseEvent, SyntheticEvent } from "react";
import {
  addBudget,
  deleteBudget,
  getBudget,
  listAccountsWithDetails,
  listBudgets,
  RecordId,
} from "../api";
import { BudgetIdentifiers } from "../../../cli/bindings/BudgetIdentifiers";
import { useBudgetNavigate } from "../hooks/budget";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { CreateSplitBudgetOptions } from "../../../cli/bindings/CreateSplitBudgetOptions";
import { filterFloat } from "../utils";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";
import { useParams } from "react-router-dom";
import { Budget } from "../../../cli/bindings/Budget";
import { Account } from "../../../cli/bindings/Account";

function DeleteBudgetDialog({
  budget,
  open,
  setOpen,
  handleUpdateBudgets,
}: {
  budget: BudgetIdentifiers;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateBudgets: (budget: RecordId) => void;
}) {
  const navigate = useBudgetNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;

  const handleCloseForm = () => {
    setOpen(false);
  };

  const handleDeleteBudget = async () => {
    deleteBudget(budget.id)
      .then(() => {
        handleCloseForm();
        handleUpdateBudgets(budget.id);
        navigate();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Dialog open={open} onClose={handleCloseForm}>
      <DialogTitle>
        Are you sure you want to delete the {budget.name} budget ?
      </DialogTitle>
      <DialogActions>
        <Button onClick={handleCloseForm}>Cancel</Button>
        <Button onClick={handleDeleteBudget}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

function AddBudgetDialog({
  open,
  setOpen,
  handleUpdateBudgets,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateBudgets: (budget: RecordId) => void;
}) {
  const navigate = useBudgetNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [accounts, setAccounts] = useState<Account[]>();

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

  const getCurrencies = (accounts: Account[]) =>
    Array.from(new Set(accounts.map((account) => account.currency)).values());

  // FIXME: filter using the backend.
  const filterAccountByCurrency = (accounts: Account[], currency: string) =>
    accounts.filter((account) => account.currency === currency);

  const handleCloseForm = () => {
    setOpen(false);
  };

  const handleValidAmount = () => isNaN(filterFloat(form.income));

  const handleBudgetSubmission = async () => {
    const income = filterFloat(form.income);
    const accounts = form.accounts.map((account) => account.id);

    addBudget({
      ...form,
      income,
      accounts,
    })
      .then((budget) => {
        handleCloseForm();
        handleUpdateBudgets(budget.id);
        navigate({ id: budget.id, name: budget.name });
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  useEffect(() => {
    listAccountsWithDetails()
      .then(setAccounts)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [dispatchSnackbar]);

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
        <Grid2 container spacing={2} sx={{ margin: 1 }}>
          <Grid2 size={5}>
            <TextField
              id="budget-name"
              label="Name"
              name="name"
              value={form.name}
              onChange={(name) => setForm({ ...form, name: name.target.value })}
            />
          </Grid2>
          <Grid2 size={3}>
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
          </Grid2>
        </Grid2>
        {accounts && (
          <Grid2 container spacing={2} sx={{ margin: 1 }}>
            <Grid2 size={5}>
              <InputLabel>Currency</InputLabel>
              <Select
                value={form.currency}
                label="Age"
                onChange={(currency) =>
                  setForm({ ...form, currency: currency.target.value })
                }
              >
                {getCurrencies(accounts).map((currency, id) => (
                  <MenuItem key={`${currency}-${id}`} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </Select>
            </Grid2>

            <Grid2 size={5}>
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
                    accounts
                      ? filterAccountByCurrency(accounts, form.currency)
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
            </Grid2>
          </Grid2>
        )}
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

function Details({ budget }: { budget: BudgetIdentifiers }) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [details, setDetails] = useState<Budget>();

  useEffect(() => {
    getBudget(budget.id)
      .then(setDetails)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [budget.id, dispatchSnackbar]);

  return (
    <>
      <Grid2 container spacing={1} alignItems="center">
        <Grid2 size={1}>
          <Typography variant="h2">{budget.name}</Typography>
        </Grid2>
        <Grid2 size={1}>
          {details && (
            <Typography variant="h5" sx={{ opacity: 0.7 }}>
              {details.type}
            </Typography>
          )}
        </Grid2>
        <Grid2 size={5}>
          {details && (
            <Typography variant="h4">
              {details.income} {details.currency}
            </Typography>
          )}
        </Grid2>
      </Grid2>
    </>
  );
}

export function Layout({ id }: { id: string | undefined }) {
  const navigate = useBudgetNavigate();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openFailure, setOpenFailure] = useState("");
  const [budgets, setBudgets] = useState<Map<string, BudgetIdentifiers>>();
  const [budgetAnchorEl, setBudgetAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const openBudgetMenu = Boolean(budgetAnchorEl);
  const openSettingsMenu = Boolean(settingsAnchorEl);

  const getBudgetIdentifiers = () =>
    id && budgets ? budgets.get(id) : undefined;

  const handleClickBudget = (event: MouseEvent<HTMLElement>) =>
    setBudgetAnchorEl(event.currentTarget);
  const handleClickSettings = (event: MouseEvent<HTMLElement>) =>
    setSettingsAnchorEl(event.currentTarget);

  const handleClose = () => {
    setBudgetAnchorEl(null);
    setSettingsAnchorEl(null);
  };

  const handleSnackbarClose = (
    _event?: SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenFailure("");
  };

  const handleSelectBudget = async (budget: BudgetIdentifiers) =>
    navigate(budget);

  const handleUpdateBudgets = () => {
    listBudgets()
      .then((budgets) =>
        setBudgets(
          new Map(budgets.map((budget) => [budget.id.id.String, budget]))
        )
      )
      .catch((error) => setOpenFailure(error));
  };

  useEffect(() => {
    handleUpdateBudgets();
  }, []);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {budgets ? (
            <>
              <Button
                id="basic-button"
                aria-controls={openBudgetMenu ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={openBudgetMenu ? "true" : undefined}
                onClick={handleClickBudget}
                variant="contained"
              >
                {id && budgets ? getBudgetIdentifiers()!.name : "Select budget"}
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={budgetAnchorEl}
                open={openBudgetMenu}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                {Array.from(budgets.values())
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((budget) => (
                    <MenuItem
                      key={budget.name}
                      selected={budget.id.id.String === id}
                      onClick={() => handleSelectBudget(budget)}
                    >
                      {budget.name}
                    </MenuItem>
                  ))}
                {budgets.size !== 0 && <Divider />}
                <MenuItem onClick={() => setOpenAddDialog(true)}>
                  Create budget
                </MenuItem>
              </Menu>
            </>
          ) : (
            <></>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />

          {/* TODO: budget actions */}
          <IconButton aria-label="delete" onClick={handleClickSettings}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            id="settings-menu"
            anchorEl={settingsAnchorEl}
            open={openSettingsMenu}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            <MenuItem onClick={() => setOpenDeleteDialog(true)}>
              Delete
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Divider sx={{ margin: 2 }} />

      {getBudgetIdentifiers() && <Details budget={getBudgetIdentifiers()!} />}

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={openFailure.length !== 0}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          failed to open the budget: {openFailure}
        </Alert>
      </Snackbar>

      <AddBudgetDialog
        open={openAddDialog}
        setOpen={setOpenAddDialog}
        handleUpdateBudgets={handleUpdateBudgets}
      />

      {id && budgets && (
        <DeleteBudgetDialog
          budget={getBudgetIdentifiers()!}
          open={openDeleteDialog}
          setOpen={setOpenDeleteDialog}
          handleUpdateBudgets={handleUpdateBudgets}
        />
      )}
    </>
  );
}

export default function () {
  const { id } = useParams();

  return <Layout id={id} />;
}
