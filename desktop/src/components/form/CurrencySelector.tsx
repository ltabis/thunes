import { MenuItem, Autocomplete, TextField, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { listCurrencies } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";

export default function ({
  currency,
  label,
  onChange,
  disabled = false,
}: {
  currency: string | null;
  label?: string;
  onChange: (currency: string | null) => void;
  disabled?: boolean;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [currencies, setCurrencies] = useState<string[]>();

  useEffect(() => {
    listCurrencies()
      .then(setCurrencies)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [dispatchSnackbar]);

  if (!currencies) return;

  return (
    <Autocomplete
      selectOnFocus
      handleHomeEndKeys
      clearOnBlur
      disablePortal
      disabled={disabled}
      value={currencies.find((x) => x === currency) || null}
      options={currencies}
      renderInput={(params) => (
        <TextField {...params} label={label ?? "Currency"} />
      )}
      renderOption={(props, option) => {
        const { key, id, ...optionProps } = props;
        return (
          <MenuItem key={`${key}-${id}`} value={option} {...optionProps}>
            <Chip label={option} />
          </MenuItem>
        );
      }}
      onChange={(_event, currency) => onChange(currency)}
    />
  );
}
