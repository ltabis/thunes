import { createContext } from 'react';

export type Route = "dashboard" | "account";

export const RouteContext = createContext("dashboard" as Route);
export const RouteDispatchContext = createContext(null);
