import {
  Alert,
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { Theme } from "../../../cli/bindings/Theme";
import { useDispatchSettings, useSettings } from "../contexts/Settings";
import { ReactNode } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { ExportBackup, ImportBackup } from "../api";
import { useDispatchSnackbar } from "../contexts/Snackbar";

function SettingDescription({ children }: { children: ReactNode }) {
  return (
    <Typography variant="body1" sx={{ m: 1, opacity: 0.75 }}>
      {children}
    </Typography>
  );
}

function SettingSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <Typography variant="h2" sx={{ m: 1 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ m: 1, opacity: 0.75 }}>
        {description}
      </Typography>

      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

      <Grid container direction="row" spacing={1}>
        {children}
      </Grid>
    </>
  );
}

const SETTINGS_GRID_PADDING = 5;

export default function Settings() {
  const settings = useSettings();
  const dispatchSettings = useDispatchSettings()!;
  const dispatchSnackbar = useDispatchSnackbar()!;

  const handleBackupDirectoryPath = async () => {
    const backups_path = await open({
      defaultPath: settings?.backups_path,
      directory: true,
      title: "select backup directory",
    });

    if (backups_path && settings) {
      dispatchSettings({
        type: "update",
        settings: {
          ...settings,
          backups_path,
        },
      });
    }
  };

  return settings ? (
    <Paper elevation={0}>
      <SettingSection
        title="Appearance"
        description="Customize the application's appearance"
      >
        <Grid size={SETTINGS_GRID_PADDING}>
          <SettingDescription>Change the application theme</SettingDescription>
        </Grid>

        <Grid size={1}>
          <FormControl fullWidth>
            <InputLabel id="theme-select">Theme</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={settings.theme}
              label="Theme"
              onChange={(event: SelectChangeEvent) => {
                dispatchSettings({
                  type: "update",
                  settings: {
                    ...settings,
                    theme: event.target.value as Theme,
                  },
                });
              }}
            >
              <MenuItem value={"system"}>System</MenuItem>
              <MenuItem value={"light"}>Light</MenuItem>
              <MenuItem value={"dark"}>Dark</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </SettingSection>

      <SettingSection title="Data" description="Storage and backups">
        <Grid size={SETTINGS_GRID_PADDING}>
          <SettingDescription>
            Select where to store your account and application data backups.
          </SettingDescription>
        </Grid>
        <Grid size={5}>
          <TextField
            fullWidth
            label="Backups path"
            value={settings.backups_path}
            onClick={handleBackupDirectoryPath}
            sx={{ cursor: "pointer" }}
          />
        </Grid>
        <Grid size={SETTINGS_GRID_PADDING}>
          <SettingDescription>
            Export your accounts and application settings to the specified
            location
          </SettingDescription>
        </Grid>
        {/* TODO: add option to regularly make backups */}
        <Grid size={5}>
          <Button
            variant="contained"
            onClick={async () => {
              ExportBackup()
                .catch((error) =>
                  dispatchSnackbar({
                    type: "open",
                    severity: "error",
                    message: error,
                  })
                )
                .then(() => console.info("backup done"));
            }}
          >
            Export now
          </Button>
        </Grid>
        <Grid size={SETTINGS_GRID_PADDING}>
          <SettingDescription>
            Import accounts and settings from a <b>.surql</b> database file.
          </SettingDescription>
        </Grid>
        <Grid size={5}>
          <Button
            variant="contained"
            onClick={async () => {
              const path = await open({
                filters: [
                  {
                    name: "thunes database file",
                    extensions: ["surql"],
                  },
                ],
                directory: false,
              });
              if (path) {
                ImportBackup(path).catch((error) =>
                  dispatchSnackbar({
                    type: "open",
                    severity: "error",
                    message: error,
                  })
                );
              }
            }}
          >
            Import database
          </Button>
          <Alert severity="warning">
            Importing a database will override your current accounts and
            settings.
          </Alert>
        </Grid>
      </SettingSection>

      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

      <Button
        variant="contained"
        onClick={() => dispatchSettings({ type: "save" })}
        sx={{ m: 1 }}
      >
        Save settings
      </Button>
    </Paper>
  ) : (
    <></>
  );
}
