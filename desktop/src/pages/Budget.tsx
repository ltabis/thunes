import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  SnackbarCloseReason,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  TextField,
  Typography,
  Stack,
  Skeleton,
} from "@mui/material";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { SyntheticEvent } from "react";
import { getBudgetAllocations, getBudgetPartitions } from "../api";
import { BudgetIdentifiers } from "../../../cli/bindings/BudgetIdentifiers";
import { useBudgetNavigate } from "../hooks/budget";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { CreateSplitBudgetOptions } from "../../../cli/bindings/CreateSplitBudgetOptions";
import { filterFloat } from "../utils";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";
import { useParams } from "react-router-dom";
import { Budget } from "../../../cli/bindings/Budget";
import { Account } from "../../../cli/bindings/Account";
import { categoryIconToMuiIcon } from "../utils/icons";
import { AddAllocationDrawer, EditAllocationDrawer } from "./budget/Allocation";
import PieChartIcon from "@mui/icons-material/PieChart";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import { AddPartitionDrawer, EditPartitionDrawer } from "./budget/Partition";
import { Partition } from "../../../cli/bindings/Partition";
import { Allocation } from "../../../cli/bindings/Allocation";
import BudgetPie, { Parameters as PieParameters } from "./budget/Pie";
import AllocationBar from "./budget/AllocationBar";
import BudgetSettings from "./budget/Settings";
import Page from "./Page";
import CustomSelector from "../components/form/CustomSelector";
import { useBudgetStore } from "../stores/budget";
import { useAccountStore } from "../stores/account";
import { useSettingStore } from "../stores/setting";

function AddBudgetDialog({
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

const computeBudgetUnallocated = (
  budget: Budget,
  allocations: Allocation[]
): number =>
  budget.income - allocations.reduce((acc, curr) => acc + curr.amount, 0);

function Details({ budget }: { budget: Budget }) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [partitions, setPartitions] = useState<Partition[] | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [editPartition, setEditPartition] = useState<Partition | null>(null);
  const [editAllocation, setEditAllocation] = useState<Allocation | null>(null);
  const [pieParameters, setPieParameters] = useState<PieParameters | null>(
    null
  );
  const [addPartition, setAddPartition] = useState(false);
  const [addAllocation, setAddAllocation] = useState(false);

  useEffect(() => {
    const getBudgetParts = async () => {
      try {
        const partitions = await getBudgetPartitions(budget.id);
        const allocations = await getBudgetAllocations(
          partitions.map((partition) => partition.id)
        );

        setAllocations(allocations);
        setPartitions(partitions);
      } catch (error) {
        dispatchSnackbar({
          type: "open",
          severity: "error",
          message: error as string,
        });
      }
    };

    getBudgetParts();
  }, [budget.id, dispatchSnackbar]);

  return (
    <Stack direction="row" sx={{ overflow: "scroll", maxHeight: "100%" }}>
      {partitions ? (
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
      ) : (
        <Stack>
          {[...Array(5)].map((_, id) => (
            <Skeleton
              key={`skeleton-${id}`}
              animation="wave"
              width={1000}
              height={100}
            />
          ))}
        </Stack>
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
              onSetParameters={(parameters) => setPieParameters(parameters)}
              width={500}
            />
            <AllocationBar budget={budget} parameters={pieParameters} />
          </Stack>
        </Stack>
      )}

      {addPartition && budget && (
        <AddPartitionDrawer
          budget={budget}
          // FIXME: bad way to trigger a re-render.
          onUpdate={() => (budget.id = { ...budget.id })}
          close={() => setAddPartition(false)}
        />
      )}

      {editPartition && (
        <EditPartitionDrawer
          partition={editPartition}
          onUpdate={() => (budget.id = { ...budget.id })}
          close={() => setEditPartition(null)}
        />
      )}

      {addAllocation && budget && (
        <AddAllocationDrawer
          budget={budget}
          onUpdate={() => (budget.id = { ...budget.id })}
          close={() => setAddAllocation(false)}
        />
      )}

      {editAllocation && budget && (
        <EditAllocationDrawer
          budget={budget}
          allocation={editAllocation}
          onUpdate={() => (budget.id = { ...budget.id })}
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
  const store = useBudgetStore();
  const settingsStore = useSettingStore();

  const [editBudget, setEditBudget] = useState<boolean>(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openFailure, setOpenFailure] = useState("");

  const handleSnackbarClose = (
    _event?: SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenFailure("");
  };

  const handleSelectBudget = async (budget: BudgetIdentifiers) => {
    settingsStore.open(budget.id.id.String, "budget");
    navigate(budget);
  };

  return (
    <Page
      toolbarStart={
        <CustomSelector
          selected={
            id
              ? {
                  name: store.getById(id)!.name,
                  value: id,
                }
              : undefined
          }
          items={Array.from(store.budgets.values()).map((budget) => ({
            name: budget.name,
            value: budget.id.id.String,
          }))}
          createPlaceholder="Create budget"
          selectPlaceholder="Select budget"
          onChange={(selected) =>
            handleSelectBudget(store.getById(selected.value)!)
          }
          onCreate={() => setOpenAddDialog(true)}
        />
      }
      actions={[
        {
          name: "Settings",
          run: () => setEditBudget(true),
        },
      ]}
    >
      {id && <Details budget={store.getById(id)!} />}

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

      <AddBudgetDialog open={openAddDialog} setOpen={setOpenAddDialog} />

      {editBudget && id && (
        <BudgetSettings
          budget={store.getById(id)!}
          onClose={() => setEditBudget(false)}
        />
      )}
    </Page>
  );
}
