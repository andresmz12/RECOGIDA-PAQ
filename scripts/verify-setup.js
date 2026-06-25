#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("\n🔍 O'Globo Cargo - Setup Verification\n");
console.log("=".repeat(50));

// Check 1: Environment Variables
console.log("\n1️⃣  Environment Variables:");
const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];

const optionalEnvVars = [
  "SENDGRID_API_KEY",
  "SENDGRID_FROM_EMAIL",
];

let envWarnings = 0;

requiredEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    const masked = varName.includes("SECRET") || varName.includes("KEY")
      ? "••••••••"
      : process.env[varName].substring(0, 20) + (process.env[varName].length > 20 ? "..." : "");
    console.log(`  ✅ ${varName}: ${masked}`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
    envWarnings++;
  }
});

optionalEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: Set`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (emails will fail silently)`);
  }
});

// Check 2: Files and Directories
console.log("\n2️⃣  Project Structure:");
const requiredFiles = [
  "prisma/schema.prisma",
  "lib/auth.ts",
  "lib/prisma.ts",
  "app/api/auth/[...nextauth]/route.ts",
];

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file}: MISSING`);
  }
});

// Check 3: Dependencies
console.log("\n3️⃣  Dependencies:");
const packageJsonPath = path.join(__dirname, "..", "package.json");
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const criticalDeps = ["next-auth", "@prisma/client", "bcryptjs"];

  criticalDeps.forEach((dep) => {
    if (packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ❌ ${dep}: NOT INSTALLED`);
    }
  });
} catch (e) {
  console.log(`  ❌ Could not read package.json`);
}

// Check 4: Database
console.log("\n4️⃣  Database Connection:");
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith("postgresql://")) {
    console.log(`  ✅ PostgreSQL detected`);
  } else if (dbUrl.startsWith("mysql://")) {
    console.log(`  ⚠️  MySQL detected (not tested)`);
  } else {
    console.log(`  ⚠️  Unknown database type`);
  }
} else {
  console.log(`  ❌ DATABASE_URL not set`);
  envWarnings++;
}

// Summary
console.log("\n" + "=".repeat(50));
if (envWarnings === 0) {
  console.log("\n✅ All critical requirements are met!");
  console.log("\nNext steps:");
  console.log("  1. Run: npx prisma migrate dev");
  console.log("  2. Run: npm run dev");
  console.log("  3. Visit: http://localhost:3000");
} else {
  console.log(`\n⚠️  ${envWarnings} critical issue(s) found!`);
  console.log("\nRequiredto continue:");
  console.log("  - Set all environment variables in .env file");
  console.log("  - Run: npx prisma migrate dev");
  console.log("\nFor more info, see: README.md and CLAUDE.md");
}

console.log("\n");
