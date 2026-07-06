-- Indexes for dashboard filters, courier views, calendar and webhook lookups.
-- Without these every query scans the full table as data grows.

CREATE INDEX IF NOT EXISTS "PickupRequest_userId_idx" ON "PickupRequest"("userId");
CREATE INDEX IF NOT EXISTS "PickupRequest_assignedCourierId_idx" ON "PickupRequest"("assignedCourierId");
CREATE INDEX IF NOT EXISTS "PickupRequest_status_idx" ON "PickupRequest"("status");
CREATE INDEX IF NOT EXISTS "PickupRequest_preferredDate_idx" ON "PickupRequest"("preferredDate");
CREATE INDEX IF NOT EXISTS "PickupRequest_contactPhone_idx" ON "PickupRequest"("contactPhone");
CREATE INDEX IF NOT EXISTS "PickupRequest_createdAt_idx" ON "PickupRequest"("createdAt");
CREATE INDEX IF NOT EXISTS "StatusHistory_pickupRequestId_idx" ON "StatusHistory"("pickupRequestId");
CREATE INDEX IF NOT EXISTS "Comment_pickupRequestId_idx" ON "Comment"("pickupRequestId");
