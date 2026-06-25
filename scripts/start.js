#!/usr/bin/env node

const { execSync, spawn } = require("child_process");

console.log("🚀 Starting O'Globo Cargo...\n");

if (!process.env.DATABASE_URL) {
  console.error("❌ FATAL: DATABASE_URL is not set.");
  console.error("   Please configure PostgreSQL in Railway and link it to this service.");
  console.error("   Variables → Add → DATABASE_URL\n");
  process.exit(1);
}

console.log("✓ DATABASE_URL detected\n");

// Run migrations
console.log("🗄️  Running database migrations...");
try {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });
  console.log("✓ Migrations completed\n");
} catch (err) {
  console.error("❌ Migrations failed:", err.message);
  process.exit(1);
}

// Start Next.js
console.log("🌐 Starting Next.js server...\n");
const child = spawn("node_modules/.bin/next", ["start"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
