import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    console.log(`\n🔍 Auth Debug Test for: ${email}\n`);

    // Step 1: Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        steps: [
          {
            step: "Find User",
            result: "FAILED",
            message: `No user found with email: ${email}`,
          },
        ],
      });
    }

    const steps = [
      {
        step: "Find User",
        result: "SUCCESS",
        message: `Found user: ${user.name} (${user.role})`,
      },
    ];

    // Step 2: Check if password exists
    if (!user.password) {
      steps.push({
        step: "Check Password Hash",
        result: "FAILED",
        message: "User has no password hash stored (password is NULL)",
      });

      return NextResponse.json({
        success: false,
        steps,
      });
    }

    steps.push({
      step: "Check Password Hash",
      result: "SUCCESS",
      message: `Password hash exists: ${user.password.substring(0, 20)}...`,
    });

    // Step 3: Compare password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (e) {
      steps.push({
        step: "Password Comparison",
        result: "ERROR",
        message: `bcrypt.compare failed: ${(e as Error).message}`,
      });

      return NextResponse.json({
        success: false,
        steps,
      });
    }

    steps.push({
      step: "Password Comparison",
      result: isPasswordValid ? "SUCCESS" : "FAILED",
      message: isPasswordValid
        ? "Password matches!"
        : "Password does NOT match",
      details: {
        inputPassword: password,
        storedHash: user.password.substring(0, 20) + "...",
        bcryptComparison: isPasswordValid,
      },
    });

    if (isPasswordValid) {
      steps.push({
        step: "Auth Result",
        result: "SUCCESS",
        message: "User can login successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    return NextResponse.json({
      success: isPasswordValid,
      steps,
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json(
      {
        error: "Debug error",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
