"use client";
import { ThemeProvider } from "@mui/material";
import { persistor, store } from "@redux/store";
import NextAdapterApp from "next-query-params/app";
import { Provider } from "react-redux";
import { QueryParamProvider } from "use-query-params";
import theme from "./theme";
import { PersistGate } from "redux-persist/integration/react";

export default function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <QueryParamProvider adapter={NextAdapterApp} options={{ enableBatching: true }}>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </QueryParamProvider>
      </PersistGate>
    </Provider>
  );
}
