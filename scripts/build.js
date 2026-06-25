#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

console.log("🚀 Starting build process...\n");

// Step 1: Create .env if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  console.log("⚠️  DATABASE_URL not set, creating dummy for build...");
  const envPath = path.join(__dirname, "..", ".env.local");
  fs.writeFileSync(
    envPath,
    "DATABASE_URL=postgresql://dummy:dummy@localhost/dummy\n"
  );
  console.log("✓ Created .env.local with dummy DATABASE_URL\n");
} else {
  console.log("✓ DATABASE_URL is set\n");
}

// Step 2: Generate Prisma Client
console.log("📦 Generating Prisma Client...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✓ Prisma Client generated\n");
} catch (error) {
  console.error("❌ Failed to generate Prisma Client");
  process.exit(1);
}

// Step 3: Build Next.js
console.log("🔨 Building Next.js application...");
try {
  execSync("next build", { stdio: "inherit" });
  console.log("✓ Next.js build completed\n");
} catch (error) {
  console.error("❌ Failed to build Next.js");
  process.exit(1);
}

// Step 4: Info about migrations
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
  console.log("ℹ️  DATABASE_URL is set for real database");
  console.log("✓ Migrations will run during Railway release phase\n");
} else {
  console.log("ℹ️  DATABASE_URL not set or is dummy");
  console.log("✓ Real migrations will run during Railway release phase\n");
}

console.log("✅ Build completed successfully!");
