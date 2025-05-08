import {
  Alert,
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
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
import Transactions from "./account/Transactions";
import { MouseEvent, SyntheticEvent } from "react";
import SettingsDrawer from "./account/Settings";
import { addAccount, listAccounts, RecordId } from "../api";
import { Account } from "../../../cli/bindings/Account";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { useParams } from "react-router-dom";
import { useAccountNavigate } from "../hooks/accounts";

function AddAccountDialog({
  open,
  setOpen,
  handleUpdateAccounts,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateAccounts: (account: RecordId) => Promise<void>;
}) {
  const navigate = useAccountNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [form, setForm] = useState<
    Omit<Account, "id" | "transaction_grid_sort_model">
  >({
    name: "",
    currency: "",
  });

  const handleCloseForm = () => {
    setOpen(false);
  };

  const handleAccountSubmission = async () => {
    addAccount(form)
      .then((account) => {
        handleCloseForm();
        handleUpdateAccounts(account.id).then(() =>
          navigate({ id: account.id, name: account.name })
        );
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
            return handleAccountSubmission();
          },
        },
      }}
    >
      <DialogTitle>Add account</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ margin: 1 }}>
          <Grid size={5}>
            <TextField
              id="account-name"
              label="Name"
              name="name"
              value={form.name}
              onChange={(name) => setForm({ ...form, name: name.target.value })}
            />
          </Grid>
          <Grid size={5}>
            <TextField
              id="account-currency"
              label="Currency"
              name="currency"
              value={form.currency}
              onChange={(currency) =>
                setForm({ ...form, currency: currency.target.value })
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseForm}>Cancel</Button>
        <Button
          disabled={form.currency === "" || form.name === ""}
          type="submit"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function () {
  const { id } = useParams();
  const navigate = useAccountNavigate();

  const [settingsDialog, setSettingsDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openFailure, setOpenFailure] = useState("");
  const [accounts, setAccounts] = useState<Map<string, AccountIdentifiers>>();
  const [accountAnchorEl, setAccountAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const openAccountMenu = Boolean(accountAnchorEl);
  const openSettingsMenu = Boolean(settingsAnchorEl);

  const getAccountIdentifiers = () =>
    id && accounts ? accounts.get(id) : undefined;

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
    navigate(account);

  const handleUpdateAccounts = async () => {
    try {
      const accounts = await listAccounts();
      setAccounts(
        new Map(accounts.map((account) => [account.id.id.String, account]))
      );
    } catch (error) {
      setOpenFailure(error as string);
    }
  };

  useEffect(() => {
    handleUpdateAccounts();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, maxHeight: "100%", overflow: "scroll" }}>
      <AppBar position="sticky">
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
                {id && accounts
                  ? getAccountIdentifiers()!.name
                  : "Select account"}
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={accountAnchorEl}
                open={openAccountMenu}
                onClose={handleClose}
              >
                {Array.from(accounts.values())
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((account) => (
                    <MenuItem
                      key={account.name}
                      selected={account.id.id.String === id}
                      onClick={() => handleSelectAccount(account)}
                    >
                      {account.name}
                    </MenuItem>
                  ))}
                {accounts.size !== 0 && <Divider />}
                <MenuItem onClick={() => setOpenAddDialog(true)}>
                  Create account
                </MenuItem>
              </Menu>
            </>
          ) : (
            <></>
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
          >
            <MenuItem
              onClick={() => {
                setSettingsDialog(true);
                handleClose();
              }}
            >
              Settings
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Divider sx={{ margin: 2 }} />

      {getAccountIdentifiers() && (
        <Transactions accountId={accounts!.get(id!)!} />
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

      <AddAccountDialog
        open={openAddDialog}
        setOpen={setOpenAddDialog}
        handleUpdateAccounts={handleUpdateAccounts}
      />

      {settingsDialog && (
        <SettingsDrawer
          account={getAccountIdentifiers()!.id}
          onClose={() => setSettingsDialog(false)}
          onChange={handleUpdateAccounts}
        />
      )}
    </Box>
  );
}
