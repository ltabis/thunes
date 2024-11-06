import { Button, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { Data as AccountData } from "../../../cli/bindings/Data";

export default function Account() {
    const [path, setPath] = useState("");
    const [account, setAccount] = useState<AccountData>();

    const getAccount = async () => {
        invoke("get_account", { path }).then(
            (newAccount) => {
                console.log(newAccount);
                setAccount(newAccount as AccountData)
            }
        ).catch((error) => {
            console.error("failed to get account:", error);
        });
    }

    return (<>
        <TextField id="outlined-basic" label="Account path" variant="outlined"
            value={path}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setPath(event.target.value);
            }}
        />
        <Button variant="text" onClick={getAccount}>Search</Button>

        {
            account ?
                <Paper elevation={0}>
                    <p>currency: {account.currency}</p>
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
                                        <TableCell align="right">{t.tags.map((tag) => (<Chip label={tag}></Chip>))}</TableCell>
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
                <></>
        }
    </>);
}