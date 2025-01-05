import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, MenuItem, Paper, Select, Skeleton, TextField, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { FormEvent, useEffect, useState, SetStateAction, Dispatch } from "react";
import AddIcon from '@mui/icons-material/Add';
import { Transaction2 } from "../../../../cli/bindings/Transaction2";
import { useAccount } from "../../contexts/Account";
import { useSettings } from "../../contexts/Settings";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const filterFloat = (value: string) => /^(-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value.replace(",", ".")) ? Number(value.replace(",", ".")) : NaN;

function AddTransaction({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const settings = useSettings()!;
    const account = useAccount()!;
    // Note: omit amount float value to enable the user to enter a floating point character.
    const [form, setForm] = useState<Omit<Transaction2, "amount"> & { amount: string }>({
        amount: "0",
        date: "",
        description: "",
        operation: "s",
        tags: []
    });

    const handleCloseForm = () => {
        setOpen(false);
    };

    const handleValidAmount = () => isNaN(parseFloat(form.amount));

    const handleTransactionSubmission = async () => {
        const amount = filterFloat(form.amount);

        const transaction = {
            ...form,
            // On autofill we get a stringified value.
            date: await invoke("get_date"),
            amount,
        };

        // FIXME: refresh table.
        invoke("add_transaction", { account, transaction })
            .then(() => {
                handleCloseForm();
            })
            .catch(error => console.error(error));
    }

    return (
        <Dialog
            open={open}
            onClose={handleCloseForm}
            PaperProps={{
                component: 'form',
                onSubmit: async (event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    return handleTransactionSubmission();
                },

            }}
        >
            <DialogTitle>Add transaction</DialogTitle>
            <DialogContent>
                <Select
                    autoFocus
                    required
                    sx={{ m: 1 }}
                    id="transaction-operation"
                    label="Operation"
                    name="operation"
                    value={form.operation}
                    onChange={(operation) => setForm({ ...form, operation: operation.target.value })}
                >
                    <MenuItem value={"s"}>Expense</MenuItem>
                    <MenuItem value={"i"}>Income</MenuItem>
                </Select>
                <TextField
                    sx={{ m: 1 }}
                    id="transaction-amount"
                    label="Amount"
                    name="amount"
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                    }}
                    value={form.amount}
                    onChange={(amount) => setForm({ ...form, amount: amount.target.value })}
                    error={handleValidAmount()}
                    helperText={handleValidAmount() && "Not a valid amount"}
                />
                <TextField
                    sx={{ m: 1 }}
                    id="transaction-description"
                    label="Description"
                    name="description"
                    value={form.description}
                    onChange={(description) => setForm({ ...form, description: description.target.value })}
                />
                <Select
                    sx={{ m: 1 }}
                    id="transaction-tags"
                    label="Tags"
                    name="tags"
                    multiple
                    value={form.tags}
                    onChange={(element) => {
                        const tags = element.target.value;
                        setForm({ ...form, tags: typeof tags === 'string' ? tags.split(',') : tags });
                    }}
                >
                    {
                        [(
                            <MenuItem
                                key="transaction-add-tag"
                                value="Add a tag"
                            >
                                <Button variant="outlined" startIcon={<AddIcon />}>
                                    Add tag
                                </Button>
                            </MenuItem>
                        )].concat(
                            settings.tags.map((name) => (
                                <MenuItem key={name} value={name}>
                                    {name}
                                </MenuItem>
                            ))
                        )
                    }
                </Select>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseForm}>Cancel</Button>
                <Button disabled={handleValidAmount()} type="submit">Add</Button>
            </DialogActions>
        </Dialog>
    );
}

export default function Transactions() {
    const account = useAccount()!;
    const [open, setOpen] = useState(false);
    const [currency, setCurrency] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<(Transaction2 & { id: number })[] | null>(null);
    const [balance, setBalance] = useState(0.0);

    const columns: GridColDef[] = [
        { field: 'description', headerName: 'Description', minWidth: 500, editable: true },
        { field: 'date', headerName: 'Date', editable: true },
        { field: 'amount', headerName: 'Amount', editable: true },
        { field: 'tags', headerName: 'Tags', editable: true },
    ];

    const paginationModel = { page: 0, pageSize: 10 };

    const handleOpenForm = () => {
        setOpen(true);
    };

    useEffect(() => {
        invoke("get_currency", { account })
            .then((currency) => setCurrency(currency as string));
        invoke("get_transactions", { account })
            .then((transactions) => setTransactions((transactions as (Transaction2 & { id: number })[]).map((t, i) => { t.id = i; return t; })));
        invoke("get_balance", { account })
            .then((balance) => setBalance(balance as number));
    }, [account]);

    return (
        <Paper elevation={0}>
            {
                balance && currency
                    ? (
                        <Typography variant="h6" >
                            {`${balance.toFixed(2)} ${currency}`}
                        </Typography>
                    )
                    : (
                        <Skeleton animation="wave" />
                    )
            }

            {transactions ?
                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={transactions}
                        columns={columns}
                        initialState={{ pagination: { paginationModel } }}
                        pageSizeOptions={[5, 10, 25, 50, 100]}
                        checkboxSelection
                        processRowUpdate={(updatedRow, originalRow) => console.log("cell edited!", updatedRow, originalRow)}
                    />

                </Box>
                : <>
                    <Skeleton animation="wave" />
                    <Skeleton animation="wave" />
                    <Skeleton animation="wave" />
                </>
            }

            <Fab color="primary" aria-label="add" sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
            }}
                onClick={handleOpenForm}
            >
                <AddIcon />
            </Fab>

            <AddTransaction open={open} setOpen={setOpen} />
        </Paper>
    );
}