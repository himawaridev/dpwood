"use client";

import { useEffect } from "react";

const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;
const KEEP_ALIVE_STORAGE_KEY = "dpwood:last-backend-ping";

const shouldPing = () => {
    if (document.visibilityState !== "visible" || !navigator.onLine) return false;

    try {
        const lastPingAt = Number(window.localStorage.getItem(KEEP_ALIVE_STORAGE_KEY) || 0);
        return !Number.isFinite(lastPingAt) || Date.now() - lastPingAt >= KEEP_ALIVE_INTERVAL_MS;
    } catch {
        return true;
    }
};

const pingBackend = async () => {
    if (!shouldPing()) return;

    try {
        const response = await fetch("/api/health", {
            method: "GET",
            cache: "no-store",
            credentials: "omit",
            keepalive: true,
        });
        if (response.ok) window.localStorage.setItem(KEEP_ALIVE_STORAGE_KEY, String(Date.now()));
    } catch {
        // Real API requests retain their own retry and error handling.
    }
};

export default function BackendKeepAlive() {
    useEffect(() => {
        const intervalId = window.setInterval(pingBackend, KEEP_ALIVE_INTERVAL_MS);
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") void pingBackend();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return null;
}
