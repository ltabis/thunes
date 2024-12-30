import { Alert, AppBar, Button, Divider, IconButton, Menu, MenuItem, Snackbar, SnackbarCloseReason, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { AccountProvider, useAccount, useDispatchAccount } from "../contexts/Account";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Transactions from "./account/Transactions";
import Details from "./account/Details";
import { MouseEvent, SyntheticEvent } from "react";

export function Layout() {
    // TODO: generalize Snackbar errors.
    const selected = useAccount();
    const dispatch = useDispatchAccount()!;

    const [openFailure, setOpenFailure] = useState("");
    const [accounts, setAccounts] = useState<string[]>();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [tab, setTab] = useState(0);

    const handleClickAccount = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSnackbarClose = (
        _event?: SyntheticEvent | Event,
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

    const handleTabChange = (_event: SyntheticEvent, newTab: number) => {
        setTab(newTab);
    };

    useEffect(() => {
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
                                            onClick={() => handleSelectAccount(account)}
                                        >
                                            {account}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </>
                            : <></>
                    }

                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />
                    {selected && <Tabs onChange={handleTabChange} value={tab} variant="fullWidth">
                        <Tab label="Details">
                        </Tab>
                        <Tab label="Transactions">
                        </Tab>
                    </Tabs>}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />

                    {/* TODO: account actions */}
                    <IconButton aria-label="delete">
                        <MoreVertIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Divider sx={{ margin: 2 }} />

            {selected &&
                <>
                    <div hidden={tab !== 0}>
                        <Details />
                    </div>
                    <div hidden={tab !== 1}>
                        <Transactions />
                    </div>
                </>
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

export default function Account() {
    return (
        <AccountProvider>
            <Layout></Layout>
        </AccountProvider>
    );
}