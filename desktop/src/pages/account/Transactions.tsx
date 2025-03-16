import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Fab,
  FormControl,
  Grid2,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  FormEvent,
  useEffect,
  useState,
  SetStateAction,
  Dispatch,
} from "react";
import AddIcon from "@mui/icons-material/Add";
import { Transaction } from "../../../../cli/bindings/Transaction";
import { TransactionWithId } from "../../../../cli/bindings/TransactionWithId";
import { useAccount } from "../../contexts/Account";
import { GridRenderEditCellParams, useGridApiContext } from "@mui/x-data-grid";
import { EditTags } from "./Tags";
import { Tag } from "../../../../cli/bindings/Tag";
import { SparkLineChart } from "@mui/x-charts";
import {
  addTags,
  addTransaction,
  EMPTY_RECORD_ID,
  getBalance,
  getCategories,
  getCurrency,
  getTransactions,
  RecordId,
  updateTransaction,
} from "../../api";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { AccountIdentifiers } from "../../../../cli/bindings/AccountIdentifiers";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { categoryIconToMuiIcon } from "../../utils/icons";
import { Category } from "../../../../cli/bindings/Category";
import { CategoryWithId } from "../../../../cli/bindings/CategoryWithId";

const filterFloat = (value: string) =>
  /^(-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value.replace(",", "."))
    ? Number(value.replace(",", "."))
    : NaN;

function EditTransactionDrawer({
  transaction,
  close,
  handleUpdateTransactions,
}: {
  transaction: TransactionWithId;
  close: () => void;
  handleUpdateTransactions: (account: AccountIdentifiers) => void;
}) {
  const account = useAccount()!;
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [categories, setCategories] = useState<Map<
    string,
    CategoryWithId
  > | null>(null);
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

    // FIXME: set other category by default.

    updateTransaction({
      ...form,
      amount,
      date: form.date.toISOString(),
    })
      .then(() => {
        handleCloseForm();
        handleUpdateTransactions(account);
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
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
          {categories && (
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category?.id.String}
                label="Category"
                onChange={(category) =>
                  setForm({
                    ...form,
                    category:
                      categories.get(category.target.value)?.id ??
                      form.category,
                  })
                }
                renderValue={(selected) => {
                  const category = categories.get(selected)!;
                  return (
                    <MenuItem>
                      <ListItemAvatar>
                        {categoryIconToMuiIcon(category)}
                      </ListItemAvatar>
                      <ListItemText primary={category.name} />
                    </MenuItem>
                  );
                }}
              >
                {Array.from(categories.values()).map((category) => (
                  <MenuItem
                    key={category.id.id.String}
                    value={category.id.id.String}
                  >
                    <ListItemAvatar>
                      {categoryIconToMuiIcon(category)}
                    </ListItemAvatar>
                    <ListItemText primary={category.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
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

function AddTransactionDialog({
  open,
  setOpen,
  handleUpdateTransactions,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateTransactions: (account: AccountIdentifiers) => void;
}) {
  const account = useAccount()!;
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [categories, setCategories] = useState<Map<
    string,
    CategoryWithId
  > | null>(null);
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
    setOpen(false);
  };

  const handleValidAmount = () => isNaN(filterFloat(form.amount));

  const handleTransactionSubmission = async () => {
    const amount = filterFloat(form.amount);

    addTransaction(account.id, {
      ...form,
      amount,
      date: form.date.toISOString(),
    })
      .then(() => {
        handleCloseForm();
        handleUpdateTransactions(account);
      })
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
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

  return (
    <Dialog
      open={open}
      onClose={handleCloseForm}
      slotProps={{
        paper: {
          component: "form",
          onSubmit: async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            return handleTransactionSubmission();
          },
        },
      }}
    >
      <DialogTitle>Add transaction</DialogTitle>
      <DialogContent>
        <Grid2 container spacing={2} sx={{ margin: 1 }}>
          <Grid2 size={5}>
            <TextField
              id="transaction-description"
              label="Description"
              name="description"
              value={form.description}
              onChange={(description) =>
                setForm({ ...form, description: description.target.value })
              }
            />
          </Grid2>
          <Grid2 size={3}>
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
          </Grid2>
          <Grid2 size={5}>
            <DatePicker
              value={form.date}
              onChange={(date) => setForm({ ...form, date: date as Dayjs })}
            />
          </Grid2>
          <Grid2 size={3}>
            <EditTags
              value={form.tags}
              handleChange={(tags) => setForm({ ...form, tags })}
            />
          </Grid2>
          <Grid2 size={8}>
            {categories && (
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category.id.String}
                  label="Category"
                  onChange={(category) =>
                    setForm({
                      ...form,
                      category: categories.get(category.target.value)!.id,
                    })
                  }
                  renderValue={(selected) => {
                    const category = categories.get(selected)!;
                    return (
                      <MenuItem>
                        <ListItemAvatar>
                          {categoryIconToMuiIcon(category)}
                        </ListItemAvatar>
                        <ListItemText primary={category.name} />
                      </MenuItem>
                    );
                  }}
                >
                  {Array.from(categories.values()).map((category) => (
                    <MenuItem
                      key={category.id.id.String}
                      value={category.id.id.String}
                    >
                      <ListItemAvatar>
                        {categoryIconToMuiIcon(category)}
                      </ListItemAvatar>
                      <ListItemText primary={category.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid2>
        </Grid2>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseForm}>Cancel</Button>
        <Button disabled={handleValidAmount()} type="submit">
          Add
        </Button>
      </DialogActions>
    </Dialog>
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

export default function Transactions() {
  const accountIdentifiers = useAccount()!;
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [open, setOpen] = useState(false);
  // FIXME: Pull the category directly from the transaction.
  const [categories, setCategories] = useState<Map<string, Category> | null>(
    null
  );
  const [currency, setCurrency] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithId[] | null>(
    null
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithId | null>(null);
  const [sparklineTransactions, setSparklineTransactions] = useState<
    TransactionWithId[] | null
  >(null);
  const [balance, setBalance] = useState(0.0);
  const handleOpenForm = () => {
    setOpen(true);
  };

  const handleUpdateTransactions = (account: AccountIdentifiers) => {
    getTransactions(account.id).then(setTransactions);
    getTransactions(account.id).then(setSparklineTransactions);
    getCurrency(account.id).then(setCurrency);
    getBalance(account.id).then(setBalance);
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
    handleUpdateTransactions(accountIdentifiers);
  }, [accountIdentifiers]);

  return (
    <Paper elevation={0}>
      {balance && currency ? (
        <Typography variant="h6">
          {`${balance.toFixed(2)} ${currency}`}
        </Typography>
      ) : (
        <Skeleton animation="wave" />
      )}

      {transactions && sparklineTransactions ? (
        <Box sx={{ height: 600, width: "100%" }}>
          <SparkLineChart
            // Sum account transaction until the last 30 days
            // and display each account state every day.
            data={(() => {
              const before = sparklineTransactions.slice(
                0,
                sparklineTransactions.length - 30
              );
              const after = sparklineTransactions.slice(-30);
              let sum = before.reduce((acc, t) => acc + t.amount, 0);

              return after.map((t) => {
                sum += t.amount;
                return sum;
              });
            })()}
            valueFormatter={(value: number | null) =>
              `${value?.toFixed(2)} ${currency}`
            }
            showHighlight
            showTooltip
            height={100}
            // TODO: add options to change the date range (1m, 5m, 1y, etc.)
            xAxis={{
              scaleType: "time",
              data: sparklineTransactions
                .slice(-30)
                .map((t) => new Date(t.date)),
              valueFormatter: (value) => value.toISOString().slice(0, 10),
            }}
          />
          <List sx={{ width: "100%", bgcolor: "background.paper" }}>
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

      {/* FIXME: button should stick to the end of the page */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
        }}
        onClick={handleOpenForm}
      >
        <AddIcon />
      </Fab>

      {/* TODO: Remove in favor of a drawer */}
      <AddTransactionDialog
        open={open}
        setOpen={setOpen}
        handleUpdateTransactions={handleUpdateTransactions}
      />

      {selectedTransaction && (
        <EditTransactionDrawer
          transaction={selectedTransaction}
          close={() => setSelectedTransaction(null)}
          handleUpdateTransactions={handleUpdateTransactions}
        />
      )}
    </Paper>
  );
}
