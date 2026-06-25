import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateTrackingCode } from "@/lib/utils";
import { sendPickupConfirmationEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      contactName,
      contactPhone,
      contactEmail,
      pickupAddress,
      pickupCity,
      pickupCountry,
      destinationCountry,
      packageType,
      estimatedWeight,
      dimensions,
      preferredDate,
      preferredTimeWindow,
      specialInstructions,
      createAccount,
      password,
      userId,
    } = body;

    // Validate required fields
    if (
      !contactName ||
      !contactPhone ||
      !pickupAddress ||
      !pickupCity ||
      !pickupCountry ||
      !destinationCountry ||
      !packageType ||
      !preferredDate ||
      !preferredTimeWindow
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate tracking code
    let trackingCode = generateTrackingCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.pickupRequest.findUnique({
        where: { trackingCode },
      });
      if (!existing) break;
      trackingCode = generateTrackingCode();
      attempts++;
    }

    let linkUserId = userId;

    // Create user account if requested
    if (createAccount && contactEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: contactEmail },
      });

      if (!existingUser) {
        if (!password) {
          return NextResponse.json(
            { error: "Password required for account creation" },
            { status: 400 }
          );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
          data: {
            email: contactEmail,
            password: hashedPassword,
            name: contactName,
            phone: contactPhone,
            role: "CUSTOMER",
          },
        });

        linkUserId = newUser.id;
      } else {
        linkUserId = existingUser.id;
      }
    }

    // Create pickup request
    const pickupRequest = await prisma.pickupRequest.create({
      data: {
        trackingCode,
        userId: linkUserId,
        contactName,
        contactPhone,
        contactEmail,
        pickupAddress,
        pickupCity,
        pickupCountry,
        destinationCountry,
        packageType,
        estimatedWeight: estimatedWeight ? parseFloat(estimatedWeight) : null,
        dimensions,
        preferredDate: new Date(preferredDate),
        preferredTimeWindow,
        specialInstructions,
        status: "PENDING",
      },
    });

    // Create initial status history entry
    await prisma.statusHistory.create({
      data: {
        pickupRequestId: pickupRequest.id,
        fromStatus: null,
        toStatus: "PENDING",
        notes: "Solicitud creada",
      },
    });

    // Send confirmation email
    if (contactEmail) {
      await sendPickupConfirmationEmail(contactEmail, trackingCode, contactName);
    }

    return NextResponse.json({
      trackingCode,
      createdAt: pickupRequest.createdAt,
      accountCreated: !!linkUserId,
    });
  } catch (error) {
    console.error("Error creating pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!["ADMIN", "COURIER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const courierId = searchParams.get("courierId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (courierId) {
      where.assignedCourierId = courierId;
    }

    // Couriers only see their own pickups
    if (role === "COURIER") {
      where.assignedCourierId = (session.user as any).id;
    }

    const pickups = await prisma.pickupRequest.findMany({
      where,
      include: {
        user: true,
        assignedCourier: true,
        statusHistory: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.pickupRequest.count({ where });

    return NextResponse.json({
      data: pickups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pickup requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
