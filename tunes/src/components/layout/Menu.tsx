import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DashboardIcon from '@mui/icons-material/Dashboard';

function Menu() {
    const DrawerList = (
        <Box sx={{ width: 250 }} role="presentation">
            <List>
                <ListItem key="Overview" disablePadding>
                    <ListItemButton>
                        <ListItemIcon>
                            <DashboardIcon></DashboardIcon>
                        </ListItemIcon>
                        <ListItemText primary="Overview" />
                    </ListItemButton>
                </ListItem>
                <ListItem key="Accounts" disablePadding>
                    <ListItemButton>
                        <ListItemIcon>
                            <AccountBalanceWalletIcon></AccountBalanceWalletIcon>
                        </ListItemIcon>
                        <ListItemText primary="Accounts" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Drawer open={true}>
            {DrawerList}
        </Drawer>
    );
}

export default Menu;
