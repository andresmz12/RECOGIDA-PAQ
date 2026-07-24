"use client";

import { useEffect } from "react";

// Registers the PWA service worker (public/sw.js). Required for the app to
// be installable (Android "Add to Home Screen" / TWA) — without an active
// service worker, browsers won't offer the install prompt at all.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[sw] registration failed:", err);
    });
  }, []);

  return null;
}
