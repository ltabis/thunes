import {
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
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
  InputAdornment,
  InputBase,
} from "@mui/material";
import { useEffect, useState } from "react";
import { TransactionWithId } from "../../../../cli/bindings/TransactionWithId";
import { GridRenderEditCellParams, useGridApiContext } from "@mui/x-data-grid";
import { EditTags } from "./Tags";
import { Tag } from "../../../../cli/bindings/Tag";
import { addTags, EMPTY_RECORD_ID, getCategories, RecordId } from "../../api";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { filterFloat } from "../../utils";
import { categoryIconToMuiIcon } from "../../utils/icons";
import { CategoryWithId } from "../../../../cli/bindings/CategoryWithId";
import CategorySelector from "../../components/form/CategorySelector";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SearchIcon from "@mui/icons-material/Search";
import { AccountIdentifiers } from "../../../../cli/bindings/AccountIdentifiers";
import TransactionAutocomplete, {
  FormTransaction,
} from "../../components/form/TransactionAutocomplete";
import AccountAutocomplete from "../../components/form/AccountAutocomplete";
import { Account } from "../../../../cli/bindings/Account";
import { useTransactionStore } from "../../stores/transaction";
import { type RowComponentProps, List } from "react-window";
import ChipDatePicker from "../../components/ChipDatePicker";

function EditTransactionDrawer({
  account,
  transaction,
  close,
}: {
  account: Account;
  transaction: TransactionWithId;
  close: () => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const transactionStore = useTransactionStore();

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
    transactionStore
      .update(account, {
        ...form,
        amount,
        date: form.date.toISOString(),
      })
      .then(() => {
        handleCloseForm();
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  };

  const handleAllocationDelete = async () => {
    transactionStore
      .delete(account, transaction)
      .then(() => {
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
  account,
  close,
}: {
  account: Account;
  close: () => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const transactionStore = useTransactionStore();
  const [form, setForm] = useState<FormTransaction>({
    id: EMPTY_RECORD_ID,
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

    transactionStore
      .create(account, {
        ...form,
        category,
        amount,
        date: form.date.toISOString(),
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
          <TransactionAutocomplete
            value={form}
            account={account}
            onChange={(transaction, reason) => {
              if (reason === "createOption") {
                setForm({
                  ...form,
                  description: transaction.description,
                });
              } else {
                setForm({ ...transaction, date: dayjs() });
              }
            }}
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
                category,
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
          onClick={() => {
            handleTransactionSubmission();
            handleCloseForm();
          }}
        >
          Add
        </Button>
        <Button
          disabled={handleValidAmount()}
          onClick={handleTransactionSubmission}
          variant="contained"
        >
          Add Another
        </Button>
      </DialogActions>
    </Drawer>
  );
}

function AddTransferDrawer({
  account,
  close,
}: {
  account: Account;
  close: () => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const transactionStore = useTransactionStore();
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
    from: account,
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

    transactionStore
      .createTransfer({
        ...form,
        from,
        to,
        amount,
        date: form.date.toISOString(),
      })
      .then(() => {
        handleCloseForm();
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

          <AccountAutocomplete
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
          <AccountAutocomplete
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

function SingleTransaction({
  transactions,
  account,
  categories,
  onClick,
  index,
  style,
}: RowComponentProps<{
  transactions: TransactionWithId[];
  account: Account;
  categories: Map<string, CategoryWithId>;
  onClick: (transaction: TransactionWithId) => void;
}>) {
  const transaction = transactions[index];

  return (
    <ListItemButton
      style={style}
      onClick={() => onClick(transaction)}
      key={transaction.id.id.String}
    >
      <ListItem
        secondaryAction={
          transaction.amount > 0 ? (
            <Typography variant="body1" color="success">
              {`+ ${transaction.amount} ${account.currency}`}
            </Typography>
          ) : (
            <Typography variant="body1">
              {`- ${transaction.amount * -1} ${account.currency}`}
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
  );
}

export default function Transactions({ account }: { account: Account }) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  // FIXME: Pull the category directly from the transaction.
  const [categories, setCategories] = useState<Map<
    string,
    CategoryWithId
  > | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithId | null>(null);

  const [addTransaction, setAddTransaction] = useState(false);
  const [addTransfer, setAddTransfer] = useState(false);
  const filter = useTransactionStore((state) => state.filter);
  const transactions = useTransactionStore((state) =>
    state.transactions.get(account.id.id.String)
  );
  const setFilter = useTransactionStore((state) => state.setFilter);

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

  return (
    <Paper elevation={0} sx={{ maxHeight: "100%" }}>
      <Stack direction="column">
        <Stack direction="row" sx={{ gap: 1 }}>
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
          <InputBase
            value={filter.search ?? ""}
            onChange={(elem) => {
              // FIXME: going too fast does not update the filter search character by character.
              setFilter(account, {
                ...filter,
                search: elem.target.value,
              });
            }}
            placeholder="Search by description"
          />

          <ChipDatePicker
            label="from"
            date={filter.start ? dayjs(filter.start) : undefined}
            onChange={(date) =>
              setFilter(account, {
                ...filter,
                // FIXME: Dirty, but enables us to set the seconds to 0 and prevent the backend to
                //        compare dates with the timestamp.
                start: date
                  ? dayjs(date.format("YYYY-MM-DD")).toISOString()
                  : undefined,
              })
            }
          />

          <ChipDatePicker
            label="to"
            date={filter.end ? dayjs(filter.end) : undefined}
            onChange={(date) =>
              setFilter(account, {
                ...filter,
                // FIXME: Dirty, but enables us to set the seconds to 0 and prevent the backend to
                //        compare dates with the timestamp.
                end: date
                  ? dayjs(date.format("YYYY-MM-DD")).toISOString()
                  : undefined,
              })
            }
          />
        </Stack>
      </Stack>
      {transactions && categories ? (
        <List
          rowComponent={SingleTransaction}
          rowCount={transactions.length}
          rowHeight={75}
          defaultHeight={10}
          rowProps={{
            transactions,
            categories,
            account,
            onClick: (transaction) => setSelectedTransaction(transaction),
          }}
          style={{
            maxHeight: "100vh",
          }}
        />
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
          account={account}
          close={() => setAddTransaction(false)}
        />
      )}

      {addTransfer && (
        <AddTransferDrawer
          account={account}
          close={() => setAddTransfer(false)}
        />
      )}

      {selectedTransaction && (
        <EditTransactionDrawer
          account={account}
          transaction={selectedTransaction}
          close={() => setSelectedTransaction(null)}
        />
      )}
    </Paper>
  );
}
