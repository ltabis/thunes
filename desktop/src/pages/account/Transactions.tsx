import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid2,
  ListItem,
  Paper,
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
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  GridSortModel,
  useGridApiContext,
} from "@mui/x-data-grid";
import { EditTags } from "./Tags";
import { Tag } from "../../../../cli/bindings/Tag";
import { Account } from "../../../../cli/bindings/Account";
import { SparkLineChart } from "@mui/x-charts";
import {
  addTags,
  addTransaction,
  getAccount,
  getBalance,
  getCurrency,
  getTransactions,
  updateAccount,
  updateTransaction,
} from "../../api";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";

const filterFloat = (value: string) =>
  /^(-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value.replace(",", "."))
    ? Number(value.replace(",", "."))
    : NaN;

function AddTransaction({
  open,
  setOpen,
  handleUpdateTransactions,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateTransactions: (account: string) => void;
}) {
  const account = useAccount()!;
  // Note: omit amount float value to enable the user to enter a floating point character.
  const [form, setForm] = useState<
    Omit<Transaction, "amount" | "date"> & { amount: string; date: Dayjs }
  >({
    amount: "0",
    description: "",
    tags: [],
    date: dayjs(),
  });

  const handleCloseForm = () => {
    setOpen(false);
  };

  const handleValidAmount = () => isNaN(parseFloat(form.amount));

  const handleTransactionSubmission = async () => {
    const amount = filterFloat(form.amount);

    addTransaction(account, {
      ...form,
      amount,
      date: form.date.toISOString(),
    })
      .then(() => {
        handleCloseForm();
        handleUpdateTransactions(account);
      })
      .catch((error) => console.error(error));
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseForm}
      PaperProps={{
        component: "form",
        onSubmit: async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          return handleTransactionSubmission();
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

  const handleChange = (newTags: Tag[]) => {
    // FIXME: only add new tags.
    addTags(newTags).catch((error) =>
      // FIXME: show error to client.
      console.error("failed to store tags", error)
    );
    apiRef.current.setEditCellValue({ id, field, value: newTags });
  };

  return <EditTags value={value} handleChange={handleChange} />;
}

export default function Transactions() {
  const accountName = useAccount()!;
  const [account, setAccount] = useState<Account>();
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithId[] | null>(
    null
  );
  const [sparklineTransactions, setSparklineTransactions] = useState<
    TransactionWithId[] | null
  >(null);
  const [balance, setBalance] = useState(0.0);

  const columns: GridColDef[] = [
    {
      field: "description",
      headerName: "Description",
      minWidth: 500,
      editable: true,
    },
    {
      field: "date",
      headerName: "Date",
      type: "dateTime",
      minWidth: 175,
      valueGetter: (value) => new Date(value),
      editable: true,
    },
    {
      field: "tags",
      type: "custom",
      headerName: "Tags",
      minWidth: 200,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (params: GridRenderCellParams<any, Tag[]>) => (
        <Stack direction="row">
          {params.value?.map((item) => {
            return (
              <ListItem
                sx={{
                  paddingLeft: 0,
                  paddingRight: 0,
                  marginLeft: 0.3,
                  marginRight: 0.3,
                }}
                key={item.label}
              >
                <Chip variant="outlined" label={item.label} />
              </ListItem>
            );
          })}
        </Stack>
      ),
      renderEditCell: (params) => <EditTagsTable {...params} />,
      editable: true,
    },
    // TODO: add color
    { field: "amount", headerName: "Amount", type: "number", editable: true },
  ];

  const paginationModel = { page: 0, pageSize: 10 };

  function getRowId(row: TransactionWithId) {
    return row.id.id.String;
  }

  const handleOpenForm = () => {
    setOpen(true);
  };

  const handleRowUpdate = (transaction: TransactionWithId) => {
    updateTransaction(transaction);
    handleUpdateTransactions(accountName);
    return transaction;
  };

  const handleUpdateTransactions = (account: string) => {
    getTransactions(account).then(setTransactions);
    getTransactions(account).then(setSparklineTransactions);
    getCurrency(account).then(setCurrency);
    getBalance(account).then(setBalance);
  };

  const handleSortModelChange = (sortModel: GridSortModel) => {
    if (account) {
      const newAccount = {
        ...account,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction_grid_sort_model: sortModel as any,
      };
      setAccount(newAccount);
      updateAccount(newAccount);
    }
  };

  useEffect(() => {
    handleUpdateTransactions(accountName);
  }, [accountName]);

  useEffect(() => {
    getAccount(accountName)
      .then(setAccount)
      .catch((error) => console.error(error));
  }, [accountName]);

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
          <DataGrid
            rows={transactions}
            columns={columns}
            getRowId={getRowId}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            checkboxSelection
            processRowUpdate={handleRowUpdate}
            onProcessRowUpdateError={(error) =>
              console.error("update error", error)
            }
            sortModel={
              // Cast to undefined in case the model is null since `sortModel`
              // does not handle null.
              (account?.transaction_grid_sort_model ?? undefined) as
                | GridSortModel
                | undefined
            }
            onSortModelChange={handleSortModelChange}
          />
        </Box>
      ) : (
        <>
          <Skeleton animation="wave" />
          <Skeleton animation="wave" />
          <Skeleton animation="wave" />
        </>
      )}

      {/* TODO: Add transfer option between two accounts */}
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

      <AddTransaction
        open={open}
        setOpen={setOpen}
        handleUpdateTransactions={handleUpdateTransactions}
      />
    </Paper>
  );
}
