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
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  SnackbarCloseReason,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  TextField,
  Toolbar,
  Typography,
  Stack,
} from "@mui/material";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { MouseEvent, SyntheticEvent } from "react";
import {
  addBudget,
  getBudget,
  getBudgetAllocations,
  getBudgetPartitions,
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
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { categoryIconToMuiIcon } from "../utils/icons";
import { AddAllocationDrawer, EditAllocationDrawer } from "./budget/Allocation";
import PieChartIcon from "@mui/icons-material/PieChart";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import { AddPartitionDrawer, EditPartitionDrawer } from "./budget/Partition";
import { Partition } from "../../../cli/bindings/Partition";
import { Allocation } from "../../../cli/bindings/Allocation";
import BudgetPie from "./budget/Pie";
import BudgetSettings from "./budget/Settings";

function AddBudgetDialog({
  open,
  setOpen,
  handleUpdateBudgets,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateBudgets: (budget: RecordId) => Promise<void>;
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
        handleUpdateBudgets(budget.id).then(() =>
          navigate({ id: budget.id, name: budget.name })
        );
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
        {accounts && (
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
                {getCurrencies(accounts).map((currency, id) => (
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
            </Grid>
          </Grid>
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

const computeBudgetUnallocated = (
  budget: Budget,
  allocations: Allocation[]
): number =>
  budget.income - allocations.reduce((acc, curr) => acc + curr.amount, 0);

function Details({ identifiers }: { identifiers: BudgetIdentifiers }) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [budget, setBudget] = useState<Budget>();
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [editPartition, setEditPartition] = useState<Partition | null>(null);
  const [editAllocation, setEditAllocation] = useState<Allocation | null>(null);
  const [addPartition, setAddPartition] = useState(false);
  const [addAllocation, setAddAllocation] = useState(false);

  useEffect(() => {
    getBudget(identifiers.id)
      .then((budget) => {
        setBudget(budget);
        getBudgetPartitions(budget.id)
          .then((partitions) => {
            setPartitions(partitions);
            getBudgetAllocations(partitions.map((partition) => partition.id))
              .then(setAllocations)
              .catch((error) =>
                dispatchSnackbar({
                  type: "open",
                  severity: "error",
                  message: error,
                })
              );
          })
          .catch((error) =>
            dispatchSnackbar({
              type: "open",
              severity: "error",
              message: error,
            })
          );
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [identifiers.id, dispatchSnackbar]);

  return (
    <Stack direction="row" sx={{ overflow: "scroll", maxHeight: "100%" }}>
      {budget && (
        <List sx={{ flexGrow: 10 }}>
          {partitions.flat().flatMap((partition) => {
            const allocationsForPartition = allocations.filter(
              (allocation) =>
                allocation.partition.id.String === partition.id.id.String
            );

            return allocationsForPartition.map((allocation, index) => (
              <ListItemButton
                key={`${allocation.category.id.id.String}-${index}`}
                onClick={() => {
                  setEditAllocation(allocation);
                }}
              >
                <ListItem
                  secondaryAction={
                    <Typography variant="body1">
                      {`${allocation.amount} ${budget.currency}`}
                    </Typography>
                  }
                  sx={{
                    borderLeft: 2,
                    borderLeftColor: partition.color,
                  }}
                >
                  <ListItemAvatar>
                    {categoryIconToMuiIcon(allocation.category)}
                  </ListItemAvatar>
                  <ListItemText
                    primary={allocation.name}
                    secondary={`${partition.name} / ${allocation.category.name}`}
                  />
                </ListItem>
              </ListItemButton>
            ));
          })}
        </List>
      )}
      {budget && (
        <Stack alignItems="flex-start" sx={{ flexGrow: 1 }}>
          {/* FIXME: add yellow, green and red following the percentage allocated. (nothing allocated is bad)*/}
          <Stack
            direction="row"
            divider={<Divider orientation="vertical" flexItem />}
            spacing={2}
          >
            <ListItem>
              <ListItemText
                primary={`+ ${budget.income} ${budget.currency}`}
                secondary="in"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={`- ${(
                  budget.income - computeBudgetUnallocated(budget, allocations)
                ).toFixed(2)} ${budget.currency}`}
                secondary="out"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={`${computeBudgetUnallocated(
                  budget,
                  allocations
                ).toFixed(2)} ${budget.currency}`}
                secondary="unused"
              />
            </ListItem>
          </Stack>
          <Stack spacing={2} sx={{ width: "100%" }}>
            <BudgetPie
              budget={budget.id}
              onClick={(partition) => setEditPartition(partition)}
              width={500}
            />
          </Stack>
        </Stack>
      )}

      {addPartition && budget && (
        <AddPartitionDrawer
          budget={budget}
          // FIXME: bad way to trigger a re-render.
          onUpdate={() => (identifiers.id = { ...identifiers.id })}
          close={() => setAddPartition(false)}
        />
      )}

      {editPartition && (
        <EditPartitionDrawer
          partition={editPartition}
          onUpdate={() => (identifiers.id = { ...identifiers.id })}
          close={() => setEditPartition(null)}
        />
      )}

      {addAllocation && budget && (
        <AddAllocationDrawer
          budget={budget}
          onUpdate={() => (identifiers.id = { ...identifiers.id })}
          close={() => setAddAllocation(false)}
        />
      )}

      {editAllocation && budget && (
        <EditAllocationDrawer
          budget={budget}
          allocation={editAllocation}
          onUpdate={() => (identifiers.id = { ...identifiers.id })}
          close={() => setEditAllocation(null)}
        />
      )}

      <SpeedDial
        color="primary"
        sx={{ position: "absolute", bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        ariaLabel={"add"}
      >
        <SpeedDialAction
          key={"add-partition"}
          icon={<PieChartIcon />}
          slotProps={{ tooltip: { title: "Add a partition" } }}
          onClick={() => setAddPartition(true)}
        />
        <SpeedDialAction
          key={"add-allocation"}
          icon={<CurrencyExchangeIcon />}
          slotProps={{ tooltip: { title: "Add a recurring expense" } }}
          onClick={() => setAddAllocation(true)}
        />
      </SpeedDial>
    </Stack>
  );
}

export default function () {
  const { id } = useParams();
  const navigate = useBudgetNavigate();

  const [editBudget, setEditBudget] = useState<boolean>(false);
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

  const handleUpdateBudgets = async () => {
    try {
      const budgets = await listBudgets();
      setBudgets(
        new Map(budgets.map((budget) => [budget.id.id.String, budget]))
      );
    } catch (error) {
      setOpenFailure(error as string);
    }
  };

  useEffect(() => {
    handleUpdateBudgets();
  }, []);

  return (
    <Stack
      spacing={2}
      divider={<Divider orientation="vertical" flexItem />}
      sx={{ flexGrow: 1 }}
    >
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
          >
            <MenuItem
              onClick={() => {
                setEditBudget(true);
                handleClose();
              }}
            >
              Settings
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {getBudgetIdentifiers() && (
        <Details identifiers={getBudgetIdentifiers()!} />
      )}

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

      {editBudget && budgets && (
        <BudgetSettings
          budget={getBudgetIdentifiers()!.id}
          onChange={handleUpdateBudgets}
          onClose={() => setEditBudget(false)}
        />
      )}
    </Stack>
  );
}
