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
import Transactions from "./account/Transactions";
import { MouseEvent, SyntheticEvent } from "react";
import Settings from "./account/Settings";
import { addAccount, deleteAccount, listAccounts, RecordId } from "../api";
import { Account } from "../../../cli/bindings/Account";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { useParams } from "react-router-dom";
import { useAccountNavigate } from "../hooks/accounts";

function DeleteAccountDialog({
  account,
  open,
  setOpen,
  handleUpdateAccounts,
}: {
  account: AccountIdentifiers;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateAccounts: (account: RecordId) => void;
}) {
  const navigate = useAccountNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;

  const handleCloseForm = () => {
    setOpen(false);
  };

  const handleDeleteAccount = async () => {
    deleteAccount(account.id)
      .then(() => {
        handleCloseForm();
        handleUpdateAccounts(account.id);
        navigate();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Dialog open={open} onClose={handleCloseForm}>
      <DialogTitle>
        Are you sure you want to delete the {account.name} account ?
      </DialogTitle>
      <DialogActions>
        <Button onClick={handleCloseForm}>Cancel</Button>
        <Button onClick={handleDeleteAccount}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

function AddAccountDialog({
  open,
  setOpen,
  handleUpdateAccounts,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateAccounts: (account: RecordId) => void;
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
        handleUpdateAccounts(account.id);
        navigate({ id: account.id, name: account.name });
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
        <Grid2 container spacing={2} sx={{ margin: 1 }}>
          <Grid2 size={5}>
            <TextField
              id="account-name"
              label="Name"
              name="name"
              value={form.name}
              onChange={(name) => setForm({ ...form, name: name.target.value })}
            />
          </Grid2>
          <Grid2 size={5}>
            <TextField
              id="account-currency"
              label="Currency"
              name="currency"
              value={form.currency}
              onChange={(currency) =>
                setForm({ ...form, currency: currency.target.value })
              }
            />
          </Grid2>
        </Grid2>
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

export function Layout({ id }: { id: string | undefined }) {
  const navigate = useAccountNavigate();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
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
  const [tab, setTab] = useState(0);

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

  const handleTabChange = (_event: SyntheticEvent, newTab: number) => {
    setTab(newTab);
  };

  const handleUpdateAccounts = () => {
    listAccounts()
      .then((accounts) =>
        setAccounts(
          new Map(accounts.map((account) => [account.id.id.String, account]))
        )
      )
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
                {id && accounts
                  ? getAccountIdentifiers()!.name
                  : "Select account"}
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
          {getAccountIdentifiers() && (
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

      {getAccountIdentifiers() && (
        <>
          <div hidden={tab !== 0}>
            <Transactions accountId={accounts!.get(id!)!.id} />
          </div>
          <div hidden={tab !== 1}>
            <Settings accountId={accounts!.get(id!)!.id} />
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

      <AddAccountDialog
        open={openAddDialog}
        setOpen={setOpenAddDialog}
        handleUpdateAccounts={handleUpdateAccounts}
      />

      {id && accounts && (
        <DeleteAccountDialog
          account={getAccountIdentifiers()!}
          open={openDeleteDialog}
          setOpen={setOpenDeleteDialog}
          handleUpdateAccounts={handleUpdateAccounts}
        />
      )}
    </>
  );
}

export default function () {
  const { id } = useParams();

  return <Layout id={id} />;
}
