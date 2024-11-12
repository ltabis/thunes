import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Settings as AppSettings } from "../../../cli/bindings/Settings";
import { Button, Paper, TextField } from "@mui/material";

export default function Settings() {
    const [settings, setSettings] = useState<AppSettings>();

    const saveSettings = () => {
        invoke("save_settings", { settings }).then(
            // TODO: generalize info with snackbars.
            () => console.info("config saved!"),
        ).catch(
            (error) => console.error(error)
        );
    }

    useEffect(() => {
        invoke("get_settings").then(
            (newSettings) => setSettings(newSettings as AppSettings)
        ).catch(
            (error) => console.error(error)
        );
    }, [setSettings]);

    return settings
        ?
        (<>
            <Paper elevation={0}>
                <TextField id="outlined-basic" label="Accounts path" variant="outlined"
                    value={settings.accounts_path}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setSettings({
                            ...settings,
                            accounts_path: event.target.value
                        });
                    }}
                />
                <Button variant="text" onClick={saveSettings}>Save</Button>
            </Paper>
        </>)
        :
        (<></>)
}