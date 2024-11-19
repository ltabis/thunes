import { Alert, AppBar, Button, Chip, Divider, Menu, MenuItem, Paper, Snackbar, SnackbarCloseReason, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Toolbar, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Data as AccountData } from "../../../cli/bindings/Data";

function Details({ selected, accounts }: { selected: string, accounts: AccountData[] }) {
    const account = accounts.find((account) => account.name === selected);

    return (
        account ?
            <Paper elevation={0}>
                <Typography>currency: {account.currency}</Typography>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} >
                        <TableHead>
                            <TableRow>
                                <TableCell align="right">description</TableCell>
                                <TableCell align="right">tags</TableCell>
                                <TableCell align="right">amount {account.currency}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {account.transactions.map((t, index) => (
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
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            :
            <Typography variant="h2">
                Account not found
            </Typography>
    );
}

export default function Account() {
    // TODO: generalize Snackbar errors.
    const [openFailure, setOpenFailure] = useState("");
    const [selectedAccount, setSelectedAccount] = useState("");
    const [accounts, setAccounts] = useState<AccountData[]>();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClickAccount = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuItemClick = (
        account: string,
    ) => {
        setSelectedAccount(account);
        setAnchorEl(null);
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

    useEffect(() => {
        invoke("get_accounts").then(
            (newAccounts) => setAccounts(newAccounts as AccountData[])
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
                                    {selectedAccount !== "" ? selectedAccount : "Select account"}
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
                                    {accounts.map((account) => (
                                        <MenuItem
                                            key={account.name}
                                            selected={account.name === selectedAccount}
                                            onClick={(_event) => handleMenuItemClick(account.name)}
                                        >
                                            {account.name}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </> : <></>
                    }
                </Toolbar>
            </AppBar>

            <Divider />

            {
                selectedAccount && accounts
                    ? <Details selected={selectedAccount} accounts={accounts}></Details>
                    : <></>
            }

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