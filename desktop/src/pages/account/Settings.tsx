import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
  TextField,
} from "@mui/material";
import { Account } from "../../../../cli/bindings/Account";
import { useState } from "react";
import { deleteAccount } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { useAccountNavigate } from "../../hooks/accounts";
import { useAccountStore } from "../../stores/account";

function DeleteAccountDialog({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const navigate = useAccountNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;

  const handleDeleteAccount = async () => {
    deleteAccount(account.id)
      .then(() => {
        onClose();
        navigate();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>
        Are you sure you want to delete the {account.name} account ?
      </DialogTitle>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleDeleteAccount}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const accountStore = useAccountStore();
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState<Account>(account);

  const handleSettingsUpdate = (account: Account) => {
    accountStore
      .update(account)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
    onClose();
  };

  if (!form) return <></>;

  return (
    <Drawer open={true} onClose={() => onClose()} anchor="right">
      <DialogTitle>Update account settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            id="name"
            label="Title"
            variant="outlined"
            value={form.name}
            onChange={(name) =>
              setForm({
                ...form,
                name: name.target.value,
              })
            }
          />
          <TextField
            id="currency"
            label="Currency"
            variant="outlined"
            value={form.currency}
            onChange={(currency) =>
              setForm({
                ...form,
                currency: currency.target.value,
              })
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialog(true)} color="error">
          Delete
        </Button>
        <Button onClick={() => handleSettingsUpdate(form)}>Update</Button>
      </DialogActions>

      {deleteDialog && (
        <DeleteAccountDialog
          account={form}
          onClose={() => setDeleteDialog(false)}
        />
      )}
    </Drawer>
  );
}
