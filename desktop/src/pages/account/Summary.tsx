import { Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { getBalance, getCurrencyFromAccount, RecordId } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { AccountIdentifiers } from "../../../../cli/bindings/AccountIdentifiers";

export default function Transactions({
  accountId,
}: {
  accountId: AccountIdentifiers;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [currency, setCurrency] = useState<string | null>(null);
  const [balance, setBalance] = useState(0.0);

  const handleUpdateTransactions = async (account: RecordId) => {
    await getCurrencyFromAccount(account).then(setCurrency);
    await getBalance(account).then(setBalance);
  };

  useEffect(() => {
    handleUpdateTransactions(accountId.id).catch((error) =>
      dispatchSnackbar({ type: "open", severity: "error", message: error })
    );
  }, [accountId, dispatchSnackbar]);

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
