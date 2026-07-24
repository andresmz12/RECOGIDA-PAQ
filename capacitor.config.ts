import type { CapacitorConfig } from "@capacitor/cli";

// This app is a dynamic, authenticated Next.js server (dashboards, live
// data, NextAuth sessions) — not a static site — so the native shell loads
// the deployed app directly over the network instead of bundling a local
// copy. `webDir` still has to point at a real folder for `cap add`/`cap
// sync` to run; it's unused at runtime once `server.url` is set below.
const config: CapacitorConfig = {
  appId: "com.oglobocargo.app",
  appName: "O'Globo Cargo",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://recogida-paq-production.up.railway.app",
    cleartext: false,
  },
};

export default config;
