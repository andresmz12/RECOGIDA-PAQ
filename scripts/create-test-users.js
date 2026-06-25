#!/usr/bin/env node

/**
 * Script to create test users in the database
 * Usage: node scripts/create-test-users.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Creating test users...");

    // Create customer
    const customerPassword = await bcrypt.hash("password123", 10);
    const customer = await prisma.user.upsert({
      where: { email: "customer@example.com" },
      update: {},
      create: {
        email: "customer@example.com",
        password: customerPassword,
        name: "Juan Cliente",
        phone: "+573001234567",
        role: "CUSTOMER",
      },
    });
    console.log("✓ Customer created:", customer.email);

    // Create dispatcher
    const dispatcherPassword = await bcrypt.hash("password123", 10);
    const dispatcher = await prisma.user.upsert({
      where: { email: "dispatcher@example.com" },
      update: {},
      create: {
        email: "dispatcher@example.com",
        password: dispatcherPassword,
        name: "Carlos Despachador",
        phone: "+573002345678",
        role: "DISPATCHER",
      },
    });
    console.log("✓ Dispatcher created:", dispatcher.email);

    // Create courier
    const courierPassword = await bcrypt.hash("password123", 10);
    const courier = await prisma.user.upsert({
      where: { email: "courier@example.com" },
      update: {},
      create: {
        email: "courier@example.com",
        password: courierPassword,
        name: "María Mensajera",
        phone: "+573003456789",
        role: "COURIER",
      },
    });
    console.log("✓ Courier created:", courier.email);

    // Create admin
    const adminPassword = await bcrypt.hash("password123", 10);
    const admin = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        password: adminPassword,
        name: "Pedro Admin",
        phone: "+573004567890",
        role: "ADMIN",
      },
    });
    console.log("✓ Admin created:", admin.email);

    console.log("\n✅ All test users created successfully!");
    console.log("\nTest Credentials:");
    console.log("─────────────────");
    console.log("Customer:  customer@example.com / password123");
    console.log("Dispatcher: dispatcher@example.com / password123");
    console.log("Courier:   courier@example.com / password123");
    console.log("Admin:     admin@example.com / password123");
  } catch (error) {
    console.error("❌ Error creating users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
