import { Alert, AppBar, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Fab, FormControl, Menu, MenuItem, Paper, Select, Skeleton, Snackbar, SnackbarCloseReason, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Toolbar, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { AccountProvider, useAccount, useDispatchAccount } from "../contexts/Account";
import { useSettings } from "../contexts/Settings";
import { Transaction } from "../../../cli/bindings/Transaction";


function AddTransaction({ open, setOpen }: { open: boolean, setOpen: any }) {
    const settings = useSettings()!;
    const account = useAccount()!;

    const handleCloseForm = () => {
        setOpen(false);
    };

    const handleTransactionSubmission = async (formData: FormData) => {
        const formJson = Object.fromEntries((formData as any).entries());
        const transaction = {
            ...formJson,
            // On autofill we get a stringified value.
            tags: typeof formJson.tags === 'string' ? formJson.tags.split(',') : formJson.tags,
            amount: parseFloat(formJson.amount),
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
                onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
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

function Details() {
    const account = useAccount()!;
    const [open, setOpen] = useState(false);
    const [currency, setCurrency] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[] | null>(null);
    const [balance, setBalance] = useState(0.0);

    const handleOpenForm = () => {
        setOpen(true);
    };

    useEffect(() => {
        invoke("get_currency", { accountName: account })
            .then((currency) => setCurrency(currency as string));
        invoke("get_transactions", { accountName: account })
            .then((transactions) => setTransactions(transactions as Transaction[]));
        invoke("get_balance", { accountName: account })
            .then((balance) => setBalance(balance as number));
    });

    return (
        <>
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
                    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                        <Table stickyHeader sx={{ minWidth: 650 }} >
                            <TableHead>
                                <TableRow>
                                    <TableCell align="right">description</TableCell>
                                    <TableCell align="right">tags</TableCell>
                                    <TableCell align="right">amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    transactions.map((t, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell align="right">{t.description}</TableCell>
                                            <TableCell align="right">{t.tags.map((tag) => (<Chip key={`${index}-${tag}`} label={tag}></Chip>))}</TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={`${t.operation === "i" ? "+" : "-"}${t.amount}`}
                                                    color={t.operation === "i" ? "success" : "error"}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
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
        </>
    );
}

export function Layout() {
    // TODO: generalize Snackbar errors.
    const selected = useAccount();
    const dispatch = useDispatchAccount()!;

    const [openFailure, setOpenFailure] = useState("");
    const [accounts, setAccounts] = useState<string[]>();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClickAccount = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSnackbarClose = (
        _event?: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason,
    ) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenFailure("");
    };

    const handleSelectAccount = async (account: string) =>
        dispatch({
            type: "select",
            account: account as string,
        });

    useEffect(() => {
        console.log("passed");
        invoke("list_accounts").then(
            (newAccounts) => setAccounts(newAccounts as string[])
        ).catch(
            (error) => setOpenFailure(error)
        );
    }, [])

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    {
                        accounts ?
                            <>
                                <Button
                                    id="basic-button"
                                    aria-controls={open ? 'basic-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={open ? 'true' : undefined}
                                    onClick={handleClickAccount}
                                    variant="contained"
                                >
                                    {selected !== "" ? selected : "Select account"}
                                </Button>
                                <Menu
                                    id="basic-menu"
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleClose}
                                    MenuListProps={{
                                        'aria-labelledby': 'basic-button',
                                    }}
                                >
                                    {accounts.sort((a, b) => a.localeCompare(b)).map((account) => (
                                        <MenuItem
                                            key={account}
                                            selected={account === selected}
                                            onClick={(_event) => handleSelectAccount(account)}
                                        >
                                            {account}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </>
                            : <></>
                    }

                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />

                    {/* {
                        selected &&
                        (
                            <Typography variant="h6" >
                                {`${balance.toFixed(2)} ${selected.currency}`}
                            </Typography>
                        )
                    } */}
                </Toolbar>
            </AppBar>

            <Divider />

            {selected && <Details></Details>}

            <Snackbar
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                open={openFailure.length !== 0} autoHideDuration={5000} onClose={handleSnackbarClose}>
                <Alert
                    onClose={handleSnackbarClose}
                    severity="error"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    failed to open the account: {openFailure}
                </Alert>
            </Snackbar>
        </>
    );

}

export default function Account() {
    return (
        <AccountProvider>
            <Layout></Layout>
        </AccountProvider>
    );
}