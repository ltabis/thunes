import {
  Alert,
  AppBar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  SnackbarCloseReason,
  Tab,
  Tabs,
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
import { addBudget, deleteBudget, listBudgets, RecordId } from "../api";
import { BudgetIdentifiers } from "../../../cli/bindings/BudgetIdentifiers";
import { useBudgetNavigate } from "../hooks/budget";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { CreateSplitBudgetOptions } from "../../../cli/bindings/CreateSplitBudgetOptions";

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
  const [form, setForm] = useState<CreateSplitBudgetOptions>({
    name: "",
    income: 0,
    accounts: [],
  });

  const handleCloseForm = () => {
    setOpen(false);
  };

  const handleBudgetSubmission = async () => {
    addBudget(form)
      .then((budget) => {
        handleCloseForm();
        handleUpdateBudgets(budget.id);
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
        </Grid2>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseForm}>Cancel</Button>
        <Button
          disabled={
            form.income === 0 || form.name === "" || form.accounts.length === 0
          }
          type="submit"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// TODO:
function Details() {
  return <></>;
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
  const [tab, setTab] = useState(0);

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

  const handleTabChange = (_event: SyntheticEvent, newTab: number) => {
    setTab(newTab);
  };

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
          {getBudgetIdentifiers() && (
            <Tabs onChange={handleTabChange} value={tab} variant="fullWidth">
              <Tab label="Transactions"></Tab>
              <Tab label="Settings"></Tab>
            </Tabs>
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

      {getBudgetIdentifiers() && (
        <div hidden={tab !== 1}>
          <Details />
        </div>
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

export default Layout;
