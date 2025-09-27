import {
  Box,
  AppBar,
  Toolbar,
  Divider,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import { useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export type Action = {
  name: string;
  run(): void;
};

export default function ({
  toolbarStart,
  toolbarEnd,
  actions,
  children,
}: {
  toolbarStart?: React.ReactNode;
  toolbarEnd?: React.ReactNode;
  actions: Action[];
  children: React.ReactNode;
}) {
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const openActionsMenu = Boolean(actionsAnchorEl);

  const handleClickActions = (event: React.MouseEvent<HTMLElement>) =>
    setActionsAnchorEl(event.currentTarget);

  const handleClose = () => setActionsAnchorEl(null);

  return (
    <Stack
      data-testid="user-profile"
      sx={{ maxHeight: "100%", flexGrow: 1, overflow: "auto" }}
    >
      <AppBar position="sticky" color="default">
        <Toolbar>
          {toolbarStart}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />

          {toolbarEnd}

          {actions.length !== 0 ? (
            <>
              <IconButton onClick={handleClickActions}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={actionsAnchorEl}
                open={openActionsMenu}
                onClose={handleClose}
              >
                {actions.map((action) => (
                  <MenuItem
                    key={action.name}
                    onClick={() => {
                      action.run();
                      handleClose();
                    }}
                  >
                    {action.name}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <></>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ m: 2, flexGrow: 1 }} data-testid="before-transactions-box">
        {children}
      </Box>
    </Stack>
  );
}
