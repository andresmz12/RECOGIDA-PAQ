import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Este endpoint prueba el flujo de registro completamente
 * POST /api/debug/test-register
 * Body: { email, password, name }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing email, password, or name" },
        { status: 400 }
      );
    }

    console.log(`\n🧪 TEST REGISTER: ${email}\n`);

    // Step 1: Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("❌ User already exists");
      return NextResponse.json({
        success: false,
        steps: [
          {
            step: "Check Existing User",
            result: "FAILED",
            message: "Email already registered",
          },
        ],
      });
    }

    console.log("✅ Step 1: User does not exist");

    // Step 2: Hash password
    let hashedPassword: string;
    try {
      console.log(`⏳ Hashing password... (${password.length} chars)`);
      hashedPassword = await bcrypt.hash(password, 10);
      console.log(`✅ Step 2: Password hashed (${hashedPassword.length} chars)`);
    } catch (e) {
      console.log(`❌ Hashing failed: ${(e as Error).message}`);
      return NextResponse.json({
        success: false,
        steps: [
          {
            step: "Hash Password",
            result: "FAILED",
            message: `bcrypt.hash failed: ${(e as Error).message}`,
          },
        ],
      });
    }

    // Step 3: Create user
    let createdUser;
    try {
      console.log(`⏳ Creating user in database...`);
      createdUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "CUSTOMER",
        },
      });
      console.log(`✅ Step 3: User created with ID ${createdUser.id}`);
    } catch (e) {
      console.log(`❌ Create user failed: ${(e as Error).message}`);
      return NextResponse.json({
        success: false,
        steps: [
          {
            step: "Create User",
            result: "FAILED",
            message: `Database error: ${(e as Error).message}`,
          },
        ],
      });
    }

    // Step 4: Verify password was saved
    console.log(`⏳ Verifying password in database...`);
    const userFromDB = await prisma.user.findUnique({
      where: { email },
    });

    if (!userFromDB) {
      console.log("❌ User not found after creation");
      return NextResponse.json({
        success: false,
        steps: [
          {
            step: "Create User",
            result: "SUCCESS",
            message: "User created",
          },
          {
            step: "Verify User Saved",
            result: "FAILED",
            message: "User not found after creation",
          },
        ],
      });
    }

    if (!userFromDB.password) {
      console.log("❌ PASSWORD IS NULL IN DATABASE!");
      return NextResponse.json({
        success: false,
        steps: [
          {
            step: "Create User",
            result: "SUCCESS",
            message: "User created",
          },
          {
            step: "Verify Password Saved",
            result: "FAILED",
            message: "⚠️ PASSWORD IS NULL! This is the bug!",
            details: {
              savedPassword: userFromDB.password,
              expectedHash: hashedPassword.substring(0, 20) + "...",
            },
          },
        ],
      });
    }

    console.log(`✅ Step 4: Password saved in database`);

    // Step 5: Test password verification
    console.log(`⏳ Testing password verification...`);
    const isPasswordValid = await bcrypt.compare(password, userFromDB.password);

    if (!isPasswordValid) {
      console.log("❌ Password verification failed");
      return NextResponse.json({
        success: false,
        steps: [
          {
            step: "Create User",
            result: "SUCCESS",
            message: "User created",
          },
          {
            step: "Verify Password Saved",
            result: "SUCCESS",
            message: "Password saved",
          },
          {
            step: "Verify Password Works",
            result: "FAILED",
            message: "Password does not verify",
          },
        ],
      });
    }

    console.log("✅ Step 5: Password verification successful");

    console.log("\n✅ ALL TESTS PASSED\n");

    return NextResponse.json({
      success: true,
      message: "✅ Register flow works perfectly!",
      steps: [
        { step: "Check Existing User", result: "SUCCESS" },
        { step: "Hash Password", result: "SUCCESS" },
        { step: "Create User", result: "SUCCESS" },
        { step: "Verify Password Saved", result: "SUCCESS" },
        { step: "Verify Password Works", result: "SUCCESS" },
      ],
      createdUser: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        passwordLength: userFromDB.password?.length,
      },
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
