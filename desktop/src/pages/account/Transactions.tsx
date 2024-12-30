import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, FormControl, MenuItem, Paper, Select, Skeleton, TextField, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { FormEvent, useEffect, useState, SetStateAction, Dispatch } from "react";
import AddIcon from '@mui/icons-material/Add';
import { Transaction } from "../../../../cli/bindings/Transaction";
import { useAccount } from "../../contexts/Account";
import { useSettings } from "../../contexts/Settings";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

function AddTransaction({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const settings = useSettings()!;
    const account = useAccount()!;

    const handleCloseForm = () => {
        setOpen(false);
    };

    const handleTransactionSubmission = async (formData: FormData) => {
        const formJson = Object.fromEntries((formData).entries());
        const transaction = {
            ...formJson,
            // On autofill we get a stringified value.
            tags: typeof formJson.tags === 'string' ? formJson.tags.split(',') : formJson.tags,
            amount: parseFloat(formJson.amount as string),
            date: await invoke("get_date"),
        } as Transaction;

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
                    return handleTransactionSubmission(new FormData(event.currentTarget));
                },
            }}
        >
            <DialogTitle>Add transaction</DialogTitle>
            <DialogContent>
                <FormControl>
                    <Select
                        autoFocus
                        required
                        id="transaction-operation"
                        label="Operation"
                        name="operation"
                        value={"s"}
                        sx={{ m: 1 }}
                    >
                        <MenuItem value={"s"}>Expense</MenuItem>
                        <MenuItem value={"i"}>Income</MenuItem>
                    </Select>
                    <TextField
                        sx={{ m: 1 }}
                        id="transaction-amount"
                        label="Amount"
                        name="amount"
                        type="number"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />
                    <TextField
                        sx={{ m: 1 }}
                        id="transaction-description"
                        label="Description"
                        name="description"
                    />
                    <Select
                        sx={{ m: 1 }}
                        id="transaction-tags"
                        label="Tags"
                        name="tags"
                        multiple
                        value={[]}
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
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseForm}>Cancel</Button>
                <Button type="submit">Add</Button>
            </DialogActions>
        </Dialog>
    );
}

export default function Transactions() {
    const account = useAccount()!;
    const [open, setOpen] = useState(false);
    const [currency, setCurrency] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<(Transaction & { id: number })[] | null>(null);
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
        invoke("get_currency", { accountName: account })
            .then((currency) => setCurrency(currency as string));
        invoke("get_transactions", { accountName: account })
            .then((transactions) => setTransactions((transactions as (Transaction & { id: number })[]).map((t, i) => { t.id = i; return t; })));
        invoke("get_balance", { accountName: account })
            .then((balance) => setBalance(balance as number));
    }, [account]);

    return (
        <Paper elevation={0}>
            {/* {
                balance && currency
                    ? (
                        <Typography variant="h6" >
                            {`${balance.toFixed(2)} ${currency}`}
                        </Typography>
                    )
                    : (
                        <Skeleton animation="wave" />
                    )
            } */}

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

            <AddTransaction open={open} setOpen={setOpen}></AddTransaction>
        </Paper>
    );
}