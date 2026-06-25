#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

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

// Seed test users if they don't exist (first time setup)
const seedScript = path.join(__dirname, "create-test-users.js");
if (fs.existsSync(seedScript)) {
  console.log("👥 Creating test users if not present...");
  try {
    execSync(`node ${seedScript}`, {
      stdio: "inherit",
      env: process.env,
    });
  } catch (err) {
    console.warn("⚠️  Could not create test users:", err.message);
    // Don't exit, this is not critical
  }
  console.log();
}

// Start Next.js
console.log("🌐 Starting Next.js server...\n");
const child = spawn("node_modules/.bin/next", ["start"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));

