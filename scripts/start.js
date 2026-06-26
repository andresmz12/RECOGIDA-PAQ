#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting O'Globo Cargo...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ FATAL: DATABASE_URL is not set.");
    console.error("   Please configure PostgreSQL in Railway and link it to this service.");
    process.exit(1);
  }

  console.log("✓ DATABASE_URL detected\n");

  // Auto-resolve any failed migrations so deploy can proceed
  console.log("🔍 Checking for failed migrations...");
  try {
    const { PrismaClient } = require("../lib/generated/client");
    const prisma = new PrismaClient();
    try {
      // Check if the migrations table exists first
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = '_prisma_migrations'
        ) AS exists
      `;

      if (tableCheck[0] && tableCheck[0].exists) {
        const rowCount = await prisma.$executeRaw`
          UPDATE "_prisma_migrations"
          SET "rolled_back_at" = NOW()
          WHERE "finished_at" IS NULL
            AND "rolled_back_at" IS NULL
            AND "started_at" IS NOT NULL
        `;
        if (rowCount > 0) {
          console.log(`⚠️  Marked ${rowCount} failed migration(s) as rolled back — will retry them now.`);
        } else {
          console.log("✓ No failed migrations found.\n");
        }
      } else {
        console.log("✓ Migrations table not yet created (first run).\n");
      }
    } finally {
      await prisma.$disconnect();
    }
  } catch (e) {
    console.log("⚠️  Could not check migration state:", e.message, "— continuing anyway.\n");
  }

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
}

main().catch((err) => {
  console.error("❌ Fatal startup error:", err);
  process.exit(1);
});
