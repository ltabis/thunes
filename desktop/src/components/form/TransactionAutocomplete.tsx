import {
  Autocomplete,
  AutocompleteChangeReason,
  TextField,
} from "@mui/material";
import { EMPTY_RECORD_ID, RecordId } from "../../api";
import dayjs, { Dayjs } from "dayjs";
import { TransactionWithId } from "../../../../cli/bindings/TransactionWithId";
import { useTransactionStore } from "../../stores/transaction";
import { Account } from "../../../../cli/bindings/Account";

export type FormTransaction = Omit<TransactionWithId, "amount" | "date"> & {
  // Omit "amount" float value to enable the user to enter a floating point character.
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
  account: Account;
  onChange: (value: FormTransaction, reason: AutocompleteChangeReason) => void;
}) {
  const transactionStore = useTransactionStore();

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
      options={Array.from(
        transactionStore.transactions.get(account.id.id.String)!
      )}
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
