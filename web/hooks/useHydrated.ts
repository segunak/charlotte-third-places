"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Returns false during server rendering and hydration, and true on the client
 * after hydration completes. Use this to keep server-rendered HTML deterministic
 * when a value depends on the current clock.
 */
export function useHydrated(): boolean {
    return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}
