-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN', 'DISPATCHER', 'COURIER');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('PENDING', 'ASSIGNED', 'SCHEDULED', 'PICKED_UP', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupRequest" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "userId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupCountry" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "estimatedWeight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTimeWindow" TEXT NOT NULL,
    "specialInstructions" TEXT,
    "status" "PickupStatus" NOT NULL DEFAULT 'PENDING',
    "assignedCourierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "pickupRequestId" TEXT NOT NULL,
    "fromStatus" "PickupStatus",
    "toStatus" "PickupStatus" NOT NULL,
    "changedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PickupRequest_trackingCode_key" ON "PickupRequest"("trackingCode");

-- CreateIndex
CREATE INDEX "PickupRequest_userId_idx" ON "PickupRequest"("userId");

-- CreateIndex
CREATE INDEX "PickupRequest_status_idx" ON "PickupRequest"("status");

-- CreateIndex
CREATE INDEX "PickupRequest_assignedCourierId_idx" ON "PickupRequest"("assignedCourierId");

-- CreateIndex
CREATE INDEX "StatusHistory_pickupRequestId_idx" ON "StatusHistory"("pickupRequestId");

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_assignedCourierId_fkey" FOREIGN KEY ("assignedCourierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_pickupRequestId_fkey" FOREIGN KEY ("pickupRequestId") REFERENCES "PickupRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
