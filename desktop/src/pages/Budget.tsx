import {
  Alert,
  AppBar,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  SnackbarCloseReason,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  useEffect,
  useState,
} from "react";
import {
  budgetIsSelected,
  useBudget,
  useDispatchBudget,
} from "../contexts/Budget";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { MouseEvent, SyntheticEvent } from "react";
import {
  listBudgets,
} from "../api";
import { BudgetIdentifiers } from "../../../cli/bindings/BudgetIdentifiers";

function Budget() {
  return <></>
}

export function Layout() {
  const selected = useBudget();
  const dispatch = useDispatchBudget()!;

  const [openFailure, setOpenFailure] = useState("");
  const [budgets, setBudgets] = useState<BudgetIdentifiers[]>();
  const [budgetAnchorEl, setBudgetAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const openBudgetMenu = Boolean(budgetAnchorEl);
  const openSettingsMenu = Boolean(settingsAnchorEl);
  const [tab, setTab] = useState(0);

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
    dispatch({
      type: "select",
      budget,
    });

  const handleTabChange = (_event: SyntheticEvent, newTab: number) => {
    setTab(newTab);
  };

  const handleUpdateBudgets = () => {
    listBudgets()
      .then(setBudgets)
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
                {budgetIsSelected(selected)
                  ? selected!.name
                  : "Select budget"}
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
                {budgets
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((budget) => (
                    <MenuItem
                      key={budget.name}
                      selected={budget.id === selected?.id}
                      onClick={() => handleSelectBudget(budget)}
                    >
                      {budget.name}
                    </MenuItem>
                  ))}
                <Divider />
                {/* <MenuItem onClick={() => setOpenAddDialog(true)}>
                  Create budget
                </MenuItem> */}
              </Menu>
            </>
          ) : (
            <></>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />
          {budgetIsSelected(selected) && (
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
            {/* <MenuItem onClick={() => setOpenDeleteDialog(true)}>
              Delete
            </MenuItem> */}
          </Menu>
        </Toolbar>
      </AppBar>

      <Divider sx={{ margin: 2 }} />

      {budgetIsSelected(selected) && (
        <div hidden={tab !== 1}>
          <Budget />
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

    </>
  );
}

export default Layout;
