import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/client";
import { generateTrackingCode, generateSecurityCode } from "@/lib/utils";
import { sendPickupConfirmationEmail, sendWelcomeEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { triggerConfirmationCall } from "@/lib/call-service";
import { dispatchWebhookEvent } from "@/lib/webhook-service";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Each request triggers emails and an automated voice call — throttle
    // to stop bots from generating cost and junk data.
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`pickup:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a minute." },
        { status: 429 }
      );
    }

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
      shippingMode,
      packageType,
      estimatedWeight,
      dimensions,
      packageContents,
      packageItems,
      // Declared / insured value
      declaredValue,
      insuranceRequested,
      insuranceValue,
      // Preferences
      preferredDate,
      preferredTimeWindow,
      specialInstructions,
      notes,
      // Account
      createAccount,
      password,
      acceptedTerms,
      userId,
      // Discount & language
      discountCode,
      lang,
    } = body;

    const emailLang: "en" | "es" = lang === "en" ? "en" : "es";

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

    // Declared value and insured value are mandatory on every shipment.
    const parsedDeclaredValue = parseFloat(declaredValue);
    if (isNaN(parsedDeclaredValue) || parsedDeclaredValue <= 0) {
      return NextResponse.json({ error: "Declared value is required" }, { status: 400 });
    }
    const parsedInsuranceValue = parseFloat(insuranceValue);
    if (isNaN(parsedInsuranceValue) || parsedInsuranceValue <= 0) {
      return NextResponse.json({ error: "Insurance value is required" }, { status: 400 });
    }

    // Reject malformed dates up front — new Date("garbage") would otherwise
    // blow up inside Prisma as a 500.
    if (isNaN(new Date(preferredDate).getTime())) {
      return NextResponse.json(
        { error: "Invalid preferred date" },
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

        if (acceptedTerms !== true) {
          return NextResponse.json(
            { error: "You must accept the Terms and Conditions to create an account" },
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
            termsAcceptedAt: new Date(),
          },
        });

        sendWelcomeEmail(newUser.email, newUser.name, emailLang).catch((err) =>
          console.error("[pickup-requests] sendWelcomeEmail error:", err)
        );

        linkUserId = newUser.id;
      } else {
        linkUserId = existingUser.id;
      }
    }

    // Validate discount code server-side — never trust a percent from the client
    let appliedDiscount: { code: string; percent: number } | null = null;
    if (discountCode && typeof discountCode === "string") {
      const found = await (prisma as any).discountCode.findFirst({
        where: { code: { equals: discountCode.trim(), mode: "insensitive" }, active: true },
      });
      if (found) appliedDiscount = { code: found.code, percent: found.percent };
    }

    // Pickup verification code — shown only to the customer; the courier
    // must enter it to confirm the pickup.
    const securityCode = generateSecurityCode();

    // Create pickup request
    const createData: Prisma.PickupRequestUncheckedCreateInput = {
      trackingCode,
      securityCode,
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
        shippingMode: shippingMode === "AIR" ? "AIR" : "MARITIME",
        packageType,
        estimatedWeight: estimatedWeight ? parseFloat(estimatedWeight) : null,
        dimensions: dimensions || null,
        packageContents: packageContents || null,
        packageItems: packageItems ?? null,
        declaredValue: parsedDeclaredValue,
        insuranceRequested: true,
        insuranceValue: parsedInsuranceValue,
        // Preferences
        preferredDate: new Date(preferredDate),
        preferredTimeWindow,
        specialInstructions: specialInstructions || null,
        notes: notes || null,
        status: "PENDING",
        discountCode: appliedDiscount?.code ?? null,
        discountPercent: appliedDiscount?.percent ?? null,
        lang: emailLang,
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

    // Send confirmation email in background — a SendGrid outage must not
    // fail a pickup that was already created.
    if (contactEmail) {
      sendPickupConfirmationEmail(contactEmail, trackingCode, contactName, {
        preferredDate: new Date(preferredDate),
        preferredTimeWindow,
        pickupAddress,
        pickupCity,
        destination: [recipientCity, destinationCountry].filter(Boolean).join(", "),
        packageType,
        discountCode: appliedDiscount?.code,
        discountPercent: appliedDiscount?.percent,
        securityCode,
        declaredValue: parsedDeclaredValue,
        insuranceValue: parsedInsuranceValue,
      }, emailLang).catch((err) =>
        console.error("[pickup-requests] sendPickupConfirmationEmail error:", err)
      );
    }

    // Trigger voice confirmation call in background (non-blocking)
    triggerConfirmationCall(pickupRequest.id).catch((err) =>
      console.error("[pickup-requests] triggerConfirmationCall error:", err)
    );

    // Notify external systems in background (non-blocking)
    dispatchWebhookEvent(pickupRequest.id, "CREATED").catch((err) =>
      console.error("[pickup-requests] dispatchWebhookEvent error:", err)
    );

    return NextResponse.json({
      trackingCode,
      securityCode,
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
      // Supports comma-separated values, e.g. "SCHEDULED,EN_CAMINO"
      const statuses = status.split(",").filter(Boolean);
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
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
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        assignedCourier: { select: { id: true, name: true, email: true, phone: true, role: true } },
        statusHistory: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.pickupRequest.count({ where });

    // Couriers must never see the pickup verification code — the customer
    // handing it over in person is the whole proof of pickup. They only
    // get a flag so the UI can require the input.
    const data =
      role === "COURIER"
        ? pickups.map(({ securityCode, ...rest }) => ({
            ...rest,
            requiresSecurityCode: !!securityCode,
          }))
        : pickups;

    return NextResponse.json({
      data,
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
