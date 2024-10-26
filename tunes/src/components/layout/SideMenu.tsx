import { Box, CSSObject, Drawer as MuiDrawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Theme, styled } from "@mui/material";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DashboardIcon from '@mui/icons-material/Dashboard';
import React from "react";

export default function Menu() {
    const [open, setOpen] = React.useState(false);
    const drawerWidth = 240;

    const openedMixin = (theme: Theme): CSSObject => ({
        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
        overflowX: 'hidden',
    });

    const closedMixin = (theme: Theme): CSSObject => ({
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        overflowX: 'hidden',
        width: `calc(${theme.spacing(7)} + 1px)`,
        [theme.breakpoints.up('sm')]: {
            width: `calc(${theme.spacing(8)} + 1px)`,
        },
    });

    const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
        ({ theme }) => ({
            width: drawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            variants: [
                {
                    props: ({ open }) => open,
                    style: {
                        ...openedMixin(theme),
                        '& .MuiDrawer-paper': openedMixin(theme),
                    },
                },
                {
                    props: ({ open }) => !open,
                    style: {
                        ...closedMixin(theme),
                        '& .MuiDrawer-paper': closedMixin(theme),
                    },
                },
            ],
        }),
    );


    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    const items = [
        {
            label: "Overview",
            icon: DashboardIcon,
        },
        {
            label: "Accounts",
            icon: AccountBalanceWalletIcon,
        }
    ];

    const DrawerList = (
        <Box sx={{ width: 250 }} role="presentation">
            <List onMouseOver={handleDrawerOpen} onMouseLeave={handleDrawerClose}>
                {items.map((item) => (
                    <ListItem key={item.label} disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            sx={[
                                {
                                    minHeight: 48,
                                    px: 2.5,
                                },
                                open
                                    ? {
                                        justifyContent: 'initial',
                                    }
                                    : {
                                        justifyContent: 'center',
                                    },
                            ]}
                        >
                            <ListItemIcon
                                sx={[
                                    {
                                        minWidth: 0,
                                        justifyContent: 'center',
                                    },
                                    open
                                        ? {
                                            mr: 3,
                                        }
                                        : {
                                            mr: 'auto',
                                        },
                                ]}
                            >
                                {React.createElement(item.icon)}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                sx={[
                                    open
                                        ? {
                                            opacity: 1,
                                        }
                                        : {
                                            opacity: 0,
                                        },
                                ]} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Drawer variant="permanent" open={open}>
            {DrawerList}
        </Drawer>
    );
}
