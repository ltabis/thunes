import { MenuItem, Autocomplete, TextField, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { listAccountsWithDetails } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { AccountIdentifiers } from "../../../../cli/bindings/AccountIdentifiers";
import { Account } from "../../../../cli/bindings/Account";

export default function ({
  label,
  account,
  onChange,
  filter,
  disabled = false,
}: {
  label?: string;
  account: AccountIdentifiers | null;
  onChange: (account: Account | null) => void;
  filter?: (accounts: Account[]) => Account[];
  disabled?: boolean;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [accounts, setAccounts] = useState<Account[]>();

  useEffect(() => {
    listAccountsWithDetails()
      .then(setAccounts)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [dispatchSnackbar]);

  if (!accounts) return;

  return (
    <Autocomplete
      selectOnFocus
      handleHomeEndKeys
      clearOnBlur
      disablePortal
      disableCloseOnSelect
      disabled={disabled}
      value={
        accounts.find((x) => x.id.id.String === account?.id.id.String) || null
      }
      options={filter ? filter(accounts) : accounts}
      getOptionLabel={(account) => account.name}
      renderInput={(params) => (
        <TextField {...params} label={label ?? "Account"} />
      )}
      renderOption={(props, option) => {
        const { key, id, ...optionProps } = props;
        return (
          <MenuItem key={`${key}-${id}`} value={option.name} {...optionProps}>
            <Chip label={`${option.name} (${option.currency})`} />
          </MenuItem>
        );
      }}
      onChange={(_event, account) => onChange(account)}
    />
  );
}
