import { Paper, Stack, TextField } from "@mui/material";
import { Account } from "../../../../cli/bindings/Account";
import { useEffect, useState } from "react";
import { getAccount, RecordId, updateAccount } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";

export default function Settings({ accountId }: { accountId: RecordId }) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [form, setForm] = useState<Account>();

  useEffect(() => {
    getAccount(accountId)
      .then(setForm)
      .catch((error) => dispatchSnackbar({ type: "open", severity: "error", message: error }));
  }, [accountId, dispatchSnackbar]);

  if (!form) return <></>;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedAccount = { ...form, [event.target.id]: event.target.value };
    setForm(updatedAccount);
    updateAccount(updatedAccount).catch((error) =>
      dispatchSnackbar({ type: "open", severity: "error", message: error })
    );
  };

  return (
    <>
      <Paper elevation={0} sx={{ height: "100%", m: 10 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 0, md: 4 }}
          sx={{ width: "100%", height: "100%" }}
        >
          <TextField
            id="name"
            label="Title"
            variant="outlined"
            value={form.name}
            onChange={handleChange}
          />
          <TextField
            id="currency"
            label="Currency"
            variant="outlined"
            value={form.currency}
            onChange={handleChange}
          />
        </Stack>
      </Paper>
    </>
  );
}
