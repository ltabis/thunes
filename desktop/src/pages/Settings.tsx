import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { Theme } from "../../../cli/bindings/Theme";
import { useDispatchSettings, useSettings } from "../contexts/Settings";

export default function Settings() {
  const settings = useSettings();
  const dispatch = useDispatchSettings()!;

  return settings ? (
    <>
      <Paper elevation={0}>
        <FormControl>
          <InputLabel id="theme-select">Theme</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={settings.theme}
            label="Theme"
            onChange={(event: SelectChangeEvent) => {
              dispatch({
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
        <Button
          variant="text"
          onClick={() =>
            dispatch({
              type: "save",
            })
          }
        >
          Save
        </Button>
      </Paper>
    </>
  ) : (
    <></>
  );
}
