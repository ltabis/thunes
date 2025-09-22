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
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import Transactions from "./account/Transactions";
import Summary from "./account/Summary";
import { SyntheticEvent } from "react";
import SettingsDrawer from "./account/Settings";
import { Account } from "../../../cli/bindings/Account";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";
import { useDispatchSnackbar } from "../contexts/Snackbar";
import { useParams } from "react-router-dom";
import { useAccountNavigate } from "../hooks/accounts";
import Page from "./Page";
import { Item } from "../components/form/CustomSelector";
import CustomSelector from "../components/form/CustomSelector";
import { useAccountStore } from "../stores/account";
import { useSettingStore } from "../stores/setting";

function AddAccountDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const accountStore = useAccountStore();
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
    accountStore
      .create(form)
      .then((account) => {
        handleCloseForm();
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
  const accountStore = useAccountStore();
  const settingsStore = useSettingStore();

  const handleSnackbarClose = (
    _event?: SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenFailure("");
  };

  const handleSelectAccount = async (account: AccountIdentifiers) => {
    settingsStore.open(account.id.id.String, "account");
    navigate(account);
  };

  return (
    <Page
      toolbarStart={
        <CustomSelector
          selected={
            id
              ? ({
                  name: accountStore.accounts.get(id)!.name,
                  value: id,
                } as Item)
              : undefined
          }
          items={Array.from(accountStore.accounts.values()).map((account) => ({
            name: account.name,
            value: account.id.id.String,
          }))}
          createPlaceholder="Create account"
          selectPlaceholder="Select account"
          onChange={(selected) =>
            handleSelectAccount(accountStore.accounts.get(selected.value)!)
          }
          onCreate={() => setOpenAddDialog(true)}
        />
      }
      toolbarEnd={id && <Summary account={accountStore.accounts.get(id)!} />}
      actions={[
        {
          name: "Settings",
          run: () => {
            setSettingsDialog(true);
          },
        },
      ]}
    >
      <Box sx={{ maxHeight: "100%" }}>
        {id && <Transactions account={accountStore.accounts.get(id)!} />}

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

        <AddAccountDialog open={openAddDialog} setOpen={setOpenAddDialog} />

        {settingsDialog && id && (
          <SettingsDrawer
            account={accountStore.accounts.get(id)!}
            onClose={() => setSettingsDialog(false)}
          />
        )}
      </Box>
    </Page>
  );
}
