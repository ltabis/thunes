import { MenuItem, Autocomplete, TextField, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { BudgetIdentifiers } from "../../../../cli/bindings/BudgetIdentifiers";
import { listBudgets } from "../../api";

export default function ({
  label,
  budget,
  onChange,
  filter,
  disabled = false,
}: {
  label?: string;
  budget: BudgetIdentifiers | null;
  onChange: (budget: BudgetIdentifiers | null) => void;
  filter?: (budgets: BudgetIdentifiers[]) => BudgetIdentifiers[];
  disabled?: boolean;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [budgets, setBudgets] = useState<BudgetIdentifiers[]>();

  useEffect(() => {
    listBudgets()
      .then(setBudgets)
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [dispatchSnackbar]);

  if (!budgets) return;

  return (
    <Autocomplete
      selectOnFocus
      handleHomeEndKeys
      clearOnBlur
      disablePortal
      disableCloseOnSelect
      disabled={disabled}
      value={
        budgets.find((x) => x.id.id.String === budget?.id.id.String) || null
      }
      options={filter ? filter(budgets) : budgets}
      getOptionLabel={(budget) => budget.name}
      renderInput={(params) => (
        <TextField {...params} label={label ?? "Budget"} />
      )}
      renderOption={(props, option) => {
        const { key, id, ...optionProps } = props;
        return (
          <MenuItem key={`${key}-${id}`} value={option.name} {...optionProps}>
            <Chip label={option.name} />
          </MenuItem>
        );
      }}
      onChange={(_event, budget) => onChange(budget)}
    />
  );
}
