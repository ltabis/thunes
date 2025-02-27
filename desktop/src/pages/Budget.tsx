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
  accountIsSelected,
  useAccount,
  useDispatchAccount,
} from "../contexts/Account";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Transactions from "./account/Transactions";
import { MouseEvent, SyntheticEvent } from "react";
import Settings from "./account/Settings";
import {
  listAccounts,
} from "../api";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";

export function Layout() {
  const selected = useAccount();
  const dispatch = useDispatchAccount()!;

  const [openFailure, setOpenFailure] = useState("");
  const [accounts, setAccounts] = useState<AccountIdentifiers[]>();
  const [accountAnchorEl, setAccountAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const openAccountMenu = Boolean(accountAnchorEl);
  const openSettingsMenu = Boolean(settingsAnchorEl);
  const [tab, setTab] = useState(0);

  const handleClickAccount = (event: MouseEvent<HTMLElement>) =>
    setAccountAnchorEl(event.currentTarget);
  const handleClickSettings = (event: MouseEvent<HTMLElement>) =>
    setSettingsAnchorEl(event.currentTarget);

  const handleClose = () => {
    setAccountAnchorEl(null);
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

  const handleSelectAccount = async (account: AccountIdentifiers) =>
    dispatch({
      type: "select",
      account,
    });

  const handleTabChange = (_event: SyntheticEvent, newTab: number) => {
    setTab(newTab);
  };

  const handleUpdateAccounts = () => {
    listAccounts()
      .then(setAccounts)
      .catch((error) => setOpenFailure(error));
  };

  useEffect(() => {
    handleUpdateAccounts();
  }, []);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {accounts ? (
            <>
              <Button
                id="basic-button"
                aria-controls={openAccountMenu ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={openAccountMenu ? "true" : undefined}
                onClick={handleClickAccount}
                variant="contained"
              >
                {accountIsSelected(selected)
                  ? selected!.name
                  : "Select budget"}
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={accountAnchorEl}
                open={openAccountMenu}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                {accounts
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((account) => (
                    <MenuItem
                      key={account.name}
                      selected={account.id === selected?.id}
                      onClick={() => handleSelectAccount(account)}
                    >
                      {account.name}
                    </MenuItem>
                  ))}
                <Divider />
                <MenuItem onClick={() => setOpenAddDialog(true)}>
                  Create account
                </MenuItem>
              </Menu>
            </>
          ) : (
            <></>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />
          {accountIsSelected(selected) && (
            <Tabs onChange={handleTabChange} value={tab} variant="fullWidth">
              <Tab label="Transactions"></Tab>
              <Tab label="Settings"></Tab>
            </Tabs>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />

          {/* TODO: account actions */}
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

      {accountIsSelected(selected) && (
        <>
          <div hidden={tab !== 0}>
            <Transactions />
          </div>
          <div hidden={tab !== 1}>
            <Settings />
          </div>
        </>
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
          failed to open the account: {openFailure}
        </Alert>
      </Snackbar>

    </>
  );
}

export default Layout;
