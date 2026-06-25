#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: "customer@example.com",
    password: "password123",
    name: "Juan Cliente",
    phone: "+573001234567",
    role: "CUSTOMER",
  },
  {
    email: "dispatcher@example.com",
    password: "password123",
    name: "Carlos Despachador",
    phone: "+573002345678",
    role: "DISPATCHER",
  },
  {
    email: "courier@example.com",
    password: "password123",
    name: "María Mensajera",
    phone: "+573003456789",
    role: "COURIER",
  },
  {
    email: "admin@example.com",
    password: "password123",
    name: "Pedro Admin",
    phone: "+573004567890",
    role: "ADMIN",
  },
];

async function main() {
  try {
    console.log("Creating/updating test users...");

    for (const u of TEST_USERS) {
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.upsert({
        where: { email: u.email },
        update: { password: hashed, name: u.name, role: u.role },
        create: {
          email: u.email,
          password: hashed,
          name: u.name,
          phone: u.phone,
          role: u.role,
        },
      });
      console.log(`✓ ${u.role}: ${u.email}`);
    }

    console.log("\n✅ Test users ready. Password for all: password123");
  } catch (error) {
    console.error("❌ Error creating users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
