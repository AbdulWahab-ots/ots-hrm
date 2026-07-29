"use client";
import React from "react";
import { Provider } from "react-redux";
import { persistor, store } from "@/store/store";
import { PersistGate } from "redux-persist/integration/react";

export default function ThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Provider store={store}>
      {/*
        `loading={children}` renders the same tree the server rendered
        (against the store's pre-rehydration initial state) until
        redux-persist finishes rehydrating post-mount. This keeps the very
        first client render byte-for-byte identical to SSR output, avoiding
        the hydration mismatch that came from the auth slice populating
        before/racing with React's initial hydrate pass.
      */}
      <PersistGate loading={children} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}