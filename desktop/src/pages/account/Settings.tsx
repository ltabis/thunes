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
import { useEffect, useState } from "react";
import { deleteAccount, getAccount, RecordId, updateAccount } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { AccountIdentifiers } from "../../../../cli/bindings/AccountIdentifiers";
import { useAccountNavigate } from "../../hooks/accounts";

function DeleteAccountDialog({
  account,
  onClose,
  onChange,
}: {
  account: AccountIdentifiers;
  onClose: () => void;
  onChange: (account: RecordId) => void;
}) {
  const navigate = useAccountNavigate();
  const dispatchSnackbar = useDispatchSnackbar()!;

  const handleDeleteAccount = async () => {
    deleteAccount(account.id)
      .then(() => {
        onClose();
        onChange(account.id);
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
  onChange,
}: {
  account: RecordId;
  onClose: () => void;
  onChange: (account: RecordId) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState<Account>();

  const handleSettingsUpdate = (account: Account) => {
    updateAccount(account).catch((error) =>
      dispatchSnackbar({ type: "open", severity: "error", message: error })
    );
    onChange(account.id);
    onClose();
  };

  useEffect(() => {
    getAccount(account)
      .then(setForm)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [account, dispatchSnackbar]);

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
          account={{ id: form.id, name: form.name }}
          onClose={() => setDeleteDialog(false)}
          onChange={onChange}
        />
      )}
    </Drawer>
  );
}
