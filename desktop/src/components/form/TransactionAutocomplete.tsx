import {
  Autocomplete,
  AutocompleteChangeReason,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { EMPTY_RECORD_ID, getTransactions, RecordId } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import dayjs, { Dayjs } from "dayjs";
import { TransactionWithId } from "../../../../cli/bindings/TransactionWithId";

export type FormTransaction = Omit<TransactionWithId, "amount" | "date"> & {
  amount: string;
  date: Dayjs;
  category: RecordId;
};

export default function ({
  value,
  account,
  onChange,
}: {
  value: FormTransaction;
  account: RecordId;
  onChange: (value: FormTransaction, reason: AutocompleteChangeReason) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [transactions, setTransactions] = useState<Set<TransactionWithId>>();

  useEffect(() => {
    getTransactions(account)
      .then((t) => setTransactions(new Set(t)))
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [account, dispatchSnackbar]);

  return (
    <Autocomplete
      selectOnFocus
      handleHomeEndKeys
      disablePortal
      disableClearable
      value={{
        ...value,
        date: value!.date.toString(),
        amount: parseInt(value!.amount),
      }}
      options={transactions ? Array.from(transactions) : []}
      getOptionLabel={(option) => option.description}
      getOptionKey={(option) => option.id.id.String}
      renderInput={(params) => <TextField {...params} label="Description" />}
      onInputChange={(_event, value, reason) => {
        if (reason === "input") {
          onChange(
            {
              description: value,
              amount: "0",
              category: EMPTY_RECORD_ID,
              date: dayjs(),
              id: EMPTY_RECORD_ID,
              tags: [],
            },
            "createOption"
          );
        }
      }}
      onChange={(_event, value, reason) =>
        onChange(
          {
            ...value,
            amount: value.amount.toString(),
            date: dayjs(value.date),
          },
          reason
        )
      }
    />
  );
}
