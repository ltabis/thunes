import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Snackbar,
  SnackbarCloseReason,
  TextField,
} from "@mui/material";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import Transactions from "./account/Transactions";
import Summary from "./account/Summary";
import { SyntheticEvent } from "react";
import SettingsDrawer from "./account/Settings";
import { addAccount, listAccounts, RecordId } from "../api";
import { Account } from "../../../cli/bindings/Account";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { useParams } from "react-router-dom";
import { useAccountNavigate } from "../hooks/accounts";
import Page from "./Page";
import { Item } from "../components/form/CustomSelector";
import CustomSelector from "../components/form/CustomSelector";

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

  const getAccountIdentifiers = () =>
    id && accounts ? accounts.get(id) : undefined;

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

  if (!accounts) return;

  return (
    <Page
      toolbarStart={
        <CustomSelector
          selected={
            id
              ? ({
                  name: accounts.get(id)!.name,
                  value: id,
                } as Item)
              : undefined
          }
          items={Array.from(accounts.values()).map((account) => ({
            name: account.name,
            value: account.id.id.String,
          }))}
          createPlaceholder="Create account"
          selectPlaceholder="Select account"
          onChange={(selected) =>
            handleSelectAccount(accounts.get(selected.value)!)
          }
          onCreate={() => setOpenAddDialog(true)}
        />
      }
      toolbarEnd={
        getAccountIdentifiers() && (
          <Summary accountId={getAccountIdentifiers()!} />
        )
      }
      actions={[
        {
          name: "Settings",
          run: () => {
            setSettingsDialog(true);
          },
        },
      ]}
    >
      <Box>
        {getAccountIdentifiers() && (
          <Transactions accountId={getAccountIdentifiers()!} />
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

        {settingsDialog && getAccountIdentifiers() && (
          <SettingsDrawer
            account={getAccountIdentifiers()!.id}
            onClose={() => setSettingsDialog(false)}
            onChange={handleUpdateAccounts}
          />
        )}
      </Box>
    </Page>
  );
}
