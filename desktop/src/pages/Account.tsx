import { Alert, Chip, FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Snackbar, SnackbarCloseReason, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
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

    const handleClose = (
        _event?: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason,
    ) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenFailure("");
    };

    const handleSelectedAccountChange = (event: SelectChangeEvent) => {
        setSelectedAccount(event.target.value);
    }

    useEffect(() => {
        invoke("get_accounts").then(
            (newAccounts) => setAccounts(newAccounts as AccountData[])
        ).catch(
            (error) => setOpenFailure(error)
        );
    }, [])

    return (
        <>
            {accounts ?
                <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Accounts</InputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Accounts"
                        value={selectedAccount}
                        onChange={handleSelectedAccountChange}
                    >
                        {
                            accounts.map((account) =>
                                <MenuItem key={account.name} value={account.name}>{account.name}</MenuItem>
                            )
                        }
                    </Select>
                </FormControl>
                : <></>
            }

            {
                selectedAccount && accounts
                    ? <Details selected={selectedAccount} accounts={accounts}></Details>
                    : <></>
            }

            <Snackbar
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                open={openFailure.length !== 0} autoHideDuration={5000} onClose={handleClose}>
                <Alert
                    onClose={handleClose}
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