"use client";
import React from "react";
import { Provider } from "react-redux";
import { persistor, store } from "@/store/store";
import { PersistGate } from "redux-persist/integration/react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Provider store={store}>
      {/*
        `children` reads live Redux state (e.g. Sidebar reads auth.user for role-based
        nav items), so passing it as `loading` doesn't "freeze" it at pre-rehydration
        state — it mounts the same live tree immediately, before the persisted `auth`
        slice finishes loading from localStorage. redux-persist's storage read resolves
        on a microtask, often before hydration's reconciliation pass completes, so the
        client's first paint could already reflect the rehydrated user while the
        server-rendered HTML reflects the pre-rehydration (empty) state — a hydration
        mismatch. A genuinely neutral `loading` fallback keeps the first client render
        identical to SSR; the real tree then mounts as a normal post-hydration update.
      */}
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}