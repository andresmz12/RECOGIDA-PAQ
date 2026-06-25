#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

console.log("🚀 Starting build process...\n");

const envPath = path.join(__dirname, "..", ".env.local");
let createdDummyEnv = false;

// Step 1: Pass dummy DATABASE_URL inline for prisma generate only
if (!process.env.DATABASE_URL) {
  console.log("⚠️  DATABASE_URL not set, using dummy for prisma generate...\n");
  createdDummyEnv = true;
}

// Step 2: Generate Prisma Client (pass dummy DATABASE_URL as env var inline)
console.log("📦 Generating Prisma Client...");
try {
  const env = { ...process.env };
  if (!env.DATABASE_URL) {
    env.DATABASE_URL = "postgresql://dummy:dummy@localhost/dummy";
  }
  execSync("npx prisma generate", { stdio: "inherit", env });
  console.log("✓ Prisma Client generated\n");
} catch (error) {
  console.error("❌ Failed to generate Prisma Client");
  process.exit(1);
}

// Step 3: Build Next.js (also needs DATABASE_URL for schema validation)
console.log("🔨 Building Next.js application...");
try {
  const env = { ...process.env };
  if (!env.DATABASE_URL) {
    env.DATABASE_URL = "postgresql://dummy:dummy@localhost/dummy";
  }
  execSync("next build", { stdio: "inherit", env });
  console.log("✓ Next.js build completed\n");
} catch (error) {
  console.error("❌ Failed to build Next.js");
  process.exit(1);
}

// Clean up any leftover .env.local to avoid overriding runtime DATABASE_URL
if (fs.existsSync(envPath)) {
  fs.unlinkSync(envPath);
  console.log("✓ Cleaned up temporary .env.local\n");
}

console.log("✅ Build completed successfully!");
