// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import { invoke } from "@tauri-apps/api/core";

import { CssBaseline } from "@mui/material";
// import Menu from "./components/layout/SideMenu";
// import { useReducer } from "react";
// import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";

// TODO: https://react.dev/learn/scaling-up-with-reducer-and-context
function App() {
  // const [route, dispatch] = useReducer(routeReducer, "dashboard");

  // const [greetMsg, setGreetMsg] = useState("");
  // const [name, setName] = useState("");

  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  //   setGreetMsg(await invoke("greet", { name }));
  // }

  return (
    <>
      <CssBaseline />
      {/* <Menu></Menu> */}

      {/* TODO: Routing */}
      {/* {context === "dashboard" ?
        (<Dashboard></Dashboard>) :
        context === "account" ?
          (<Account></Account>) : (<></>)
      } */}

      <Account></Account>
    </>
  );
}

export default App;
