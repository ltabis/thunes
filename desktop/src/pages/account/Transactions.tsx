import {
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  SpeedDial,
  SpeedDialAction,
  Stack,
  TextField,
  Typography,
  SpeedDialIcon,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Transaction } from "../../../../cli/bindings/Transaction";
import { TransactionWithId } from "../../../../cli/bindings/TransactionWithId";
import { GridRenderEditCellParams, useGridApiContext } from "@mui/x-data-grid";
import { EditTags } from "./Tags";
import { Tag } from "../../../../cli/bindings/Tag";
import {
  addTags,
  addTransaction,
  addTransactionTransfer,
  deleteTransaction,
  EMPTY_RECORD_ID,
  getBalance,
  getCategories,
  getCurrencyFromAccount,
  getTransactions,
  RecordId,
  updateTransaction,
} from "../../api";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { filterFloat } from "../../utils";
import { categoryIconToMuiIcon } from "../../utils/icons";
import { CategoryWithId } from "../../../../cli/bindings/CategoryWithId";
import CategorySelector from "../../components/form/CategorySelector";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountSelector from "../../components/form/AccountSelector";
import { AccountIdentifiers } from "../../../../cli/bindings/AccountIdentifiers";

function EditTransactionDrawer({
  accountId,
  transaction,
  close,
  onUpdate,
}: {
  accountId: RecordId;
  transaction: TransactionWithId;
  close: () => void;
  onUpdate: (account: RecordId) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;

  // Note: omit amount float value to enable the user to enter a floating point character.
  const [form, setForm] = useState<
    Omit<TransactionWithId, "amount" | "date" | "category"> & {
      amount: string;
      date: Dayjs;
      category: RecordId;
    }
  >({
    ...transaction,
    amount: transaction.amount.toString(),
    date: dayjs(transaction.date),
    category: transaction.category,
  });

  const handleCloseForm = () => {
    close();
  };

  const handleValidAmount = () => isNaN(filterFloat(form.amount));

  const handleTransactionSubmission = async () => {
    const amount = filterFloat(form.amount);

    updateTransaction({
      ...form,
      amount,
      date: form.date.toISOString(),
    })
      .then(() => {
        handleCloseForm();
        onUpdate(accountId);
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  const handleAllocationDelete = async () => {
    deleteTransaction(transaction.id)
      .then(() => {
        onUpdate(accountId);
        handleCloseForm();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Drawer open={true} onClose={handleCloseForm} anchor="right">
      <DialogTitle>Update transaction</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            id="transaction-description"
            label="Description"
            name="description"
            value={form.description}
            onChange={(description) =>
              setForm({ ...form, description: description.target.value })
            }
          />
          <TextField
            id="transaction-amount"
            label="Amount"
            name="amount"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            value={form.amount}
            onChange={(amount) =>
              setForm({ ...form, amount: amount.target.value })
            }
            error={handleValidAmount()}
            helperText={handleValidAmount() && "Not a valid amount"}
          />
          <DatePicker
            value={form.date}
            onChange={(date) => date && setForm({ ...form, date })}
          />
          <EditTags
            value={form.tags}
            handleChange={(tags) => setForm({ ...form, tags })}
          />
          <CategorySelector
            category={form.category}
            onChange={(category) =>
              setForm({
                ...form,
                category: category,
              })
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAllocationDelete} color="error">
          Delete
        </Button>
        <Button
          disabled={handleValidAmount()}
          onClick={handleTransactionSubmission}
        >
          Update
        </Button>
      </DialogActions>
    </Drawer>
  );
}

function AddTransactionDrawer({
  accountId,
  close,
  handleUpdateTransactions,
}: {
  accountId: RecordId;
  close: () => void;
  handleUpdateTransactions: (account: RecordId) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  // Note: omit amount float value to enable the user to enter a floating point character.
  const [form, setForm] = useState<
    Omit<Transaction, "amount" | "date"> & {
      amount: string;
      date: Dayjs;
      category: RecordId;
    }
  >({
    amount: "0",
    description: "",
    tags: [],
    // FIXME: should be re-run every time the UI is opened because it will
    //        keep the current date and time between two transactions otherwise.
    date: dayjs(),
    category: EMPTY_RECORD_ID,
  });

  const handleCloseForm = () => {
    close();
  };

  const handleValidAmount = () => isNaN(filterFloat(form.amount));

  const handleTransactionSubmission = async () => {
    const amount = filterFloat(form.amount);
    const category =
      form.category !== EMPTY_RECORD_ID ? form.category : undefined;

    addTransaction(accountId, {
      ...form,
      category,
      amount,
      date: form.date.toISOString(),
    })
      .then(() => {
        handleCloseForm();
        handleUpdateTransactions(accountId);
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Drawer open={true} onClose={handleCloseForm} anchor="right">
      <DialogTitle>Add transaction</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            id="transaction-description"
            label="Description"
            name="description"
            value={form.description}
            onChange={(description) =>
              setForm({ ...form, description: description.target.value })
            }
          />
          <TextField
            id="transaction-amount"
            label="Amount"
            name="amount"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            value={form.amount}
            onChange={(amount) =>
              setForm({ ...form, amount: amount.target.value })
            }
            error={handleValidAmount()}
            helperText={handleValidAmount() && "Not a valid amount"}
          />
          <DatePicker
            value={form.date}
            onChange={(date) => date && setForm({ ...form, date })}
          />
          <EditTags
            value={form.tags}
            handleChange={(tags) => setForm({ ...form, tags })}
          />
          <CategorySelector
            category={form.category}
            onChange={(category) =>
              setForm({
                ...form,
                category: category,
              })
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseForm} color="error">
          Cancel
        </Button>
        <Button
          disabled={handleValidAmount()}
          onClick={handleTransactionSubmission}
        >
          Add
        </Button>
      </DialogActions>
    </Drawer>
  );
}

function AddTransferDrawer({
  accountId,
  close,
  handleUpdateTransactions,
}: {
  accountId: AccountIdentifiers;
  close: () => void;
  handleUpdateTransactions: (account: RecordId) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  // Note: omit amount float value to enable the user to enter a floating point character.
  const [form, setForm] = useState<{
    amount: string;
    description: string;
    date: Dayjs;
    tags: Tag[];
    from: AccountIdentifiers | null;
    to: AccountIdentifiers | null;
  }>({
    amount: "0",
    description: "",
    tags: [],
    // FIXME: should be re-run every time the UI is opened because it will
    //        keep the current date and time between two transactions otherwise.
    date: dayjs(),
    from: accountId,
    to: null,
  });

  const handleCloseForm = () => {
    close();
  };

  const handleValidAmount = () => {
    const number = filterFloat(form.amount);
    if (isNaN(number)) return true;
    return number < 0;
  };
  const handleValidAccounts = () => !form.from || !form.to;

  const handleTransactionSubmission = async () => {
    const amount = filterFloat(form.amount);
    const from = form.from!.id;
    const to = form.to!.id;

    addTransactionTransfer({
      ...form,
      from,
      to,
      amount,
      date: form.date.toISOString(),
    })
      .then(() => {
        handleCloseForm();
        handleUpdateTransactions(accountId.id);
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  return (
    <Drawer open={true} onClose={handleCloseForm} anchor="right">
      <DialogTitle>Add transfer between two accounts</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            id="transaction-description"
            label="Transfer description"
            name="description"
            value={form.description}
            onChange={(description) =>
              setForm({ ...form, description: description.target.value })
            }
          />
          <TextField
            id="transaction-amount"
            label="Amount"
            name="amount"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            value={form.amount}
            onChange={(amount) =>
              setForm({ ...form, amount: amount.target.value })
            }
            error={handleValidAmount()}
            helperText={handleValidAmount() && "Not a valid amount"}
          />
          <DatePicker
            value={form.date}
            onChange={(date) => date && setForm({ ...form, date })}
          />
          <EditTags
            value={form.tags}
            handleChange={(tags) => setForm({ ...form, tags })}
          />

          <AccountSelector
            label="From"
            account={form.from}
            onChange={(from) => {
              setForm({
                ...form,
                to: null,
                from: from ? { id: from?.id, name: from?.name } : null,
              });
            }}
          />
          <AccountSelector
            label="To"
            account={form.to}
            onChange={(to) => setForm({ ...form, to })}
            filter={(accounts) => {
              const from = accounts.find(
                (account) => account.id.id.String === form.from?.id.id.String
              );

              return from
                ? accounts.filter(
                    (account) =>
                      account.currency === from.currency &&
                      account.id.id.String !== from.id.id.String
                  )
                : [];
            }}
            disabled={form.from === null}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseForm} color="error">
          Cancel
        </Button>
        <Button
          disabled={handleValidAmount() || handleValidAccounts()}
          onClick={handleTransactionSubmission}
        >
          Add
        </Button>
      </DialogActions>
    </Drawer>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EditTagsTable(props: GridRenderEditCellParams<any, Tag[]>) {
  const { id, value, field } = props;
  const apiRef = useGridApiContext();
  const dispatchSnackbar = useDispatchSnackbar()!;

  const handleChange = (newTags: Tag[]) => {
    // FIXME: only add new tags.
    addTags(newTags).catch((error) =>
      dispatchSnackbar({ type: "open", severity: "error", message: error })
    );
    apiRef.current.setEditCellValue({ id, field, value: newTags });
  };

  return <EditTags value={value} handleChange={handleChange} />;
}

export default function Transactions({
  accountId,
}: {
  accountId: AccountIdentifiers;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  // FIXME: Pull the category directly from the transaction.
  const [categories, setCategories] = useState<Map<
    string,
    CategoryWithId
  > | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithId[] | null>(
    null
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithId | null>(null);

  const [balance, setBalance] = useState(0.0);
  const [addTransaction, setAddTransaction] = useState(false);
  const [addTransfer, setAddTransfer] = useState(false);

  const handleUpdateTransactions = async (account: RecordId) => {
    await getTransactions(account).then(setTransactions);
    await getCurrencyFromAccount(account).then(setCurrency);
    await getBalance(account).then(setBalance);
  };

  useEffect(() => {
    getCategories()
      .then((categories) =>
        setCategories(
          new Map(
            categories.map((category) => [category.id.id.String, category])
          )
        )
      )
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [dispatchSnackbar]);

  useEffect(() => {
    handleUpdateTransactions(accountId.id).catch((error) =>
      dispatchSnackbar({ type: "open", severity: "error", message: error })
    );
  }, [accountId, dispatchSnackbar]);

  return (
    <Paper elevation={0} sx={{ flexGrow: 1 }}>
      <Stack direction="row">
        {balance && currency ? (
          <Typography variant="h2" sx={{ flexGrow: 1, textWrap: "nowrap" }}>
            {`${balance.toFixed(2)} ${currency}`}
          </Typography>
        ) : (
          <Skeleton animation="wave" />
        )}
      </Stack>
      {transactions ? (
        <Box sx={{ width: "100%" }}>
          <List
            sx={{
              bgcolor: "background.paper",
            }}
          >
            {transactions.map((transaction) => (
              <ListItemButton
                onClick={() => setSelectedTransaction(transaction)}
                key={transaction.id.id.String}
              >
                <ListItem
                  secondaryAction={
                    transaction.amount > 0 ? (
                      <Typography variant="body1" color="success">
                        {`+ ${transaction.amount} ${currency}`}
                      </Typography>
                    ) : (
                      <Typography variant="body1">
                        {`- ${transaction.amount * -1} ${currency}`}
                      </Typography>
                    )
                  }
                >
                  <ListItemAvatar>
                    {categories &&
                      categoryIconToMuiIcon(
                        categories.get(transaction.category.id.String)!
                      )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={transaction.description}
                    secondary={dayjs(transaction.date).format("DD MMMM YYYY")}
                  />
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1}>
                        {transaction.tags.map((tag) => (
                          <Chip
                            key={tag.label}
                            label={tag.label}
                            sx={{ backgroundColor: tag.color }}
                          />
                        ))}
                      </Stack>
                    }
                  />
                </ListItem>
              </ListItemButton>
            ))}
          </List>
        </Box>
      ) : (
        <>
          <Skeleton animation="wave" />
          <Skeleton animation="wave" />
          <Skeleton animation="wave" />
        </>
      )}

      <SpeedDial
        color="primary"
        sx={{ position: "absolute", bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        ariaLabel={"add"}
      >
        <SpeedDialAction
          key={"add-regular-transaction"}
          icon={<ReceiptIcon />}
          slotProps={{
            tooltip: {
              title: "Add a transaction",
            },
          }}
          onClick={() => setAddTransaction(true)}
        />
        <SpeedDialAction
          key={"add-allocation"}
          icon={<SwapHorizIcon />}
          slotProps={{
            tooltip: {
              title: "Add a transfer of money between accounts",
            },
          }}
          onClick={() => setAddTransfer(true)}
        />
      </SpeedDial>

      {addTransaction && (
        <AddTransactionDrawer
          accountId={accountId.id}
          handleUpdateTransactions={handleUpdateTransactions}
          close={() => setAddTransaction(false)}
        />
      )}

      {addTransfer && (
        <AddTransferDrawer
          accountId={accountId}
          handleUpdateTransactions={handleUpdateTransactions}
          close={() => setAddTransfer(false)}
        />
      )}

      {selectedTransaction && (
        <EditTransactionDrawer
          accountId={accountId.id}
          transaction={selectedTransaction}
          close={() => setSelectedTransaction(null)}
          onUpdate={handleUpdateTransactions}
        />
      )}
    </Paper>
  );
}
