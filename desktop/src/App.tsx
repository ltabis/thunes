import {
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SettingsIcon from "@mui/icons-material/Settings";
import PieChartIcon from "@mui/icons-material/PieChart";
import Account from "./pages/Account";
import { Route, Routes, Outlet, useNavigate } from "react-router-dom";
import Portfolio from "./pages/Portfolio";
import React from "react";
import Settings from "./pages/Settings";
import { darkTheme, lightTheme } from "./Themes";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { SnackbarProvider } from "./contexts/Snackbar";
import Budget from "./pages/Budget";
import { useSettingStore } from "./stores/setting";

function Layout() {
  const store = useSettingStore();
  const navigate = useNavigate();
  const drawerWidth = 240;

  const topItems = [
    {
      label: "Portfolio",
      icon: DashboardIcon,
      path: () => "/",
    },
    {
      label: "Accounts",
      icon: AccountBalanceWalletIcon,
      path: () =>
        store.opened.account ? `/account/${store.opened.account}` : "/account",
    },
    {
      label: "Budgets",
      icon: PieChartIcon,
      path: () =>
        store.opened.budget ? `/budget/${store.opened.budget}` : "/budget",
    },
  ];

  const bottomItems = [
    {
      label: "Settings",
      icon: SettingsIcon,
      path: () => "/settings",
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider
        theme={store.settings?.theme === "dark" ? darkTheme : lightTheme}
      >
        <CssBaseline />
        <SnackbarProvider>
          <Box sx={{ display: "flex" }}>
            <Drawer
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                  width: drawerWidth,
                  boxSizing: "border-box",
                },
              }}
              variant="permanent"
              anchor="left"
            >
              <List sx={{ flex: 2 }}>
                {topItems.map((item) => (
                  <ListItem
                    key={item.label}
                    disablePadding
                    sx={{ display: "block" }}
                  >
                    <ListItemButton onClick={() => navigate(item.path())}>
                      <ListItemIcon>
                        {React.createElement(item.icon)}
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <List>
                {bottomItems.map((item) => (
                  <ListItem
                    key={item.label}
                    disablePadding
                    sx={{ display: "block" }}
                  >
                    <ListItemButton onClick={() => navigate(item.path())}>
                      <ListItemIcon>
                        {React.createElement(item.icon)}
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Drawer>
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: "flex",
                bgcolor: "background.default",
                p: 3,
                maxHeight: "100vh",
                overflow: "scroll",
              }}
            >
              <Outlet />
            </Box>
          </Box>
        </SnackbarProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Portfolio />} />
        <Route path="account/:id?" element={<Account />} />
        <Route path="budget/:id?" element={<Budget />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
