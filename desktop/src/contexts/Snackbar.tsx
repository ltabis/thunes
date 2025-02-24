import {
  Alert,
  Snackbar as MuiSnackbar,
  SnackbarCloseReason,
} from "@mui/material";
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from "react";

export type Action =
  | { type: "open"; severity: Severity; message: string }
  | { type: "close" };
export type SnackbarState = {
  open: boolean;
  severity: Severity;
  message: string;
};
type Severity = "success" | "info" | "warning" | "error";

const SnackbarDispatchContext = createContext<Dispatch<Action> | null>(null);

export function snackbarReducer(
  _state: SnackbarState,
  action: Action
): SnackbarState {
  switch (action.type) {
    case "open": {
      return {
        open: true,
        severity: action.severity,
        message: action.message,
      };
    }
    case "close": {
      return {
        open: false,
        severity: "info",
        message: "",
      };
    }
  }
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(snackbarReducer, {
    open: false,
    severity: "info",
    message: "",
  });

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }

    dispatch({ type: "close" });
  };

  return (
    <SnackbarDispatchContext.Provider value={dispatch}>
      {children}
      <MuiSnackbar
        open={state.open}
        autoHideDuration={5000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {state.message}
        </Alert>
      </MuiSnackbar>
    </SnackbarDispatchContext.Provider>
  );
}

export const useDispatchSnackbar = () => useContext(SnackbarDispatchContext);
