import { Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { getBalance, getCurrencyFromAccount } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { Account } from "../../../../cli/bindings/Account";
import { useTransactionStore } from "../../stores/transactions";

export default function Transactions({ account }: { account: Account }) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [currency, setCurrency] = useState<string | null>(null);
  const [balance, setBalance] = useState(0.0);

  useEffect(() => {
    const handleUpdateTransactions = async (account: Account) => {
      await getCurrencyFromAccount(account.id)
        .then(setCurrency)
        .catch((error) =>
          dispatchSnackbar({ type: "open", severity: "error", message: error })
        );
      await getBalance(account.id)
        .then(setBalance)
        .catch((error) =>
          dispatchSnackbar({ type: "open", severity: "error", message: error })
        );
    };

    handleUpdateTransactions(account);

    const unsubscribe = useTransactionStore.subscribe(async () => {
      handleUpdateTransactions(account);
    });

    return unsubscribe;
  }, [account, dispatchSnackbar]);

  return (
    <Stack direction="row">
      {balance && currency ? (
        <Typography variant="h4" sx={{ textWrap: "nowrap" }}>
          {`${balance.toFixed(2)} ${currency}`}
        </Typography>
      ) : (
        <Skeleton animation="wave" />
      )}
    </Stack>
  );
}
