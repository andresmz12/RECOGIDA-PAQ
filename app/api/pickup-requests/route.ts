import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/client";
import { generateTrackingCode } from "@/lib/utils";
import { isValidEmail, isValidUSPhone, isValidIntlPhone } from "@/lib/validation";
import { sendPickupConfirmationEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { triggerConfirmationCall } from "@/lib/call-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      // Sender/pickup
      contactName,
      contactPhone,
      contactEmail,
      pickupAddress,
      pickupCity,
      pickupState,
      pickupPostalCode,
      pickupCountry,
      // Recipient
      recipientName,
      recipientEmail,
      recipientPhone,
      recipientPhoneSecondary,
      recipientAddress,
      recipientCity,
      recipientState,
      recipientPostalCode,
      recipientCountry,
      destinationCountry,
      // Package
      packageType,
      estimatedWeight,
      dimensions,
      packageContents,
      packageItems,
      // Preferences
      preferredDate,
      preferredTimeWindow,
      specialInstructions,
      notes,
      // Account
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
      !recipientName ||
      !recipientPhone ||
      !recipientAddress ||
      !recipientCity ||
      !recipientCountry ||
      !packageType ||
      !preferredDate ||
      !preferredTimeWindow
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate formats: sender (pickup) is always US; recipient is international.
    if (!isValidUSPhone(contactPhone)) {
      return NextResponse.json(
        { error: "Enter a valid US phone number for the sender (10 digits)." },
        { status: 400 }
      );
    }
    if (contactEmail && !isValidEmail(contactEmail)) {
      return NextResponse.json(
        { error: "Enter a valid sender email address." },
        { status: 400 }
      );
    }
    if (!isValidIntlPhone(recipientPhone)) {
      return NextResponse.json(
        { error: "Enter a valid recipient phone number." },
        { status: 400 }
      );
    }
    if (recipientEmail && !isValidEmail(recipientEmail)) {
      return NextResponse.json(
        { error: "Enter a valid recipient email address." },
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

    // If a session exists, always use the authenticated user's id — ignore
    // any userId sent in the body to prevent a customer from linking a pickup
    // to a different account.
    const session = await getServerSession(authOptions);
    let linkUserId: string | undefined = session?.user
      ? (session.user as any).id
      : userId ?? undefined;

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
    const createData: Prisma.PickupRequestUncheckedCreateInput = {
      trackingCode,
      userId: linkUserId,
        // Sender/pickup
        contactName,
        contactPhone,
        contactEmail,
        pickupAddress,
        pickupCity,
        pickupState: pickupState || null,
        pickupPostalCode: pickupPostalCode || null,
        pickupCountry,
        // Recipient
        recipientName,
        recipientEmail: recipientEmail || null,
        recipientPhone,
        recipientPhoneSecondary: recipientPhoneSecondary || null,
        recipientAddress,
        recipientCity,
        recipientState: recipientState || null,
        recipientPostalCode: recipientPostalCode || null,
        recipientCountry,
        destinationCountry,
        // Package
        packageType,
        estimatedWeight: estimatedWeight ? parseFloat(estimatedWeight) : null,
        dimensions: dimensions || null,
        packageContents: packageContents || null,
        packageItems: packageItems ?? null,
        // Preferences
        preferredDate: new Date(preferredDate),
        preferredTimeWindow,
        specialInstructions: specialInstructions || null,
        notes: notes || null,
        status: "PENDING",
    };
    const pickupRequest = await prisma.pickupRequest.create({ data: createData });

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
      await sendPickupConfirmationEmail(contactEmail, trackingCode, contactName, {
        preferredDate: new Date(preferredDate),
        preferredTimeWindow,
        pickupAddress,
        pickupCity,
        destination: [recipientCity, destinationCountry].filter(Boolean).join(", "),
        packageType,
      });
    }

    // Trigger voice confirmation call in background (non-blocking)
    triggerConfirmationCall(pickupRequest.id).catch((err) =>
      console.error("[pickup-requests] triggerConfirmationCall error:", err)
    );

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
    if (!["ADMIN", "DISPATCHER", "COURIER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const courierId = searchParams.get("courierId");
    const state = searchParams.get("state");
    const date = searchParams.get("date");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (courierId) {
      where.assignedCourierId = courierId;
    }

    // Filter by pickup (origin) US state code, e.g. FL, NY
    if (state) {
      where.pickupState = state;
    }

    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: "insensitive" } },
        { trackingCode: { contains: search, mode: "insensitive" } },
        { contactPhone: { contains: search, mode: "insensitive" } },
        { recipientName: { contains: search, mode: "insensitive" } },
        { pickupCity: { contains: search, mode: "insensitive" } },
        { pickupAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    if (date) {
      const d = new Date(date);
      where.preferredDate = {
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lt:  new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      };
    }

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (dateFrom || dateTo) {
      where.preferredDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
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
