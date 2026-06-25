#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: "customer@example.com",
    password: "password123",
    name: "John Smith",
    phone: "+1 (555) 123-4567",
    role: "CUSTOMER",
  },
  {
    email: "dispatcher@example.com",
    password: "password123",
    name: "Sarah Johnson",
    phone: "+1 (555) 234-5678",
    role: "DISPATCHER",
  },
  {
    email: "courier@example.com",
    password: "password123",
    name: "Michael Williams",
    phone: "+1 (555) 345-6789",
    role: "COURIER",
  },
  {
    email: "admin@example.com",
    password: "password123",
    name: "Robert Brown",
    phone: "+1 (555) 456-7890",
    role: "ADMIN",
  },
];

async function main() {
  try {
    console.log("Creating test users if not present...");

    for (const u of TEST_USERS) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) {
        console.log(`→ ${u.role}: ${u.email} (already exists, skipping)`);
        continue;
      }
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.create({
        data: {
          email: u.email,
          password: hashed,
          name: u.name,
          phone: u.phone,
          role: u.role,
        },
      });
      console.log(`✓ ${u.role}: ${u.email} (created)`);
    }

    console.log("\n✅ Test users ready.");
  } catch (error) {
    console.error("❌ Error creating users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
