#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔍 O'Globo Cargo - Login Debug Script\n");
  console.log("=".repeat(60));

  try {
    // Get all users
    const users = await prisma.user.findMany();

    console.log(`\n📊 Total Users in Database: ${users.length}\n`);

    for (const user of users) {
      console.log(`\n👤 User: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Password: ${user.password ? "✅ YES" : "❌ NO"}`);

      if (user.password) {
        console.log(`   Password Hash: ${user.password.substring(0, 30)}...`);

        // Try to test password verification
        const testPassword = "password123";
        try {
          const isValid = await bcrypt.compare(testPassword, user.password);
          console.log(`   Test "password123": ${isValid ? "✅ MATCHES" : "❌ Does NOT match"}`);
        } catch (e) {
          console.log(`   ⚠️  Hash validation error: ${e.message}`);
        }
      }

      console.log(`   Created: ${user.createdAt}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Debug complete\n");

    if (users.length === 0) {
      console.log("❌ WARNING: No users found in database!");
      console.log("   Run: npm run prisma:seed (or npx prisma migrate dev)\n");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
