import { Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import Account from "./pages/Account";
import { Route, Routes, Outlet, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import React from "react";
import Settings from "./pages/Settings";

function Layout() {
  const navigate = useNavigate();
  const drawerWidth = 240;

  const items = [
    {
      label: "Dashboard",
      icon: DashboardIcon,
      path: "/",
    },
    {
      label: "Accounts",
      icon: AccountBalanceWalletIcon,
      path: "/account",
    },
    {
      label: "Settings",
      icon: SettingsIcon,
      path: "/settings",
    }
  ];

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <List>
            {items.map((item) => (
              <ListItem key={item.label} disablePadding sx={{ display: 'block' }}>
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon>
                    {React.createElement(item.icon)}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
        >
          <Outlet></Outlet>
        </Box>
      </Box>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="account" element={<Account />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}