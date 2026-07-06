-- Pickup verification code: only the customer sees it; the courier must
-- enter it when confirming pickup. Legacy rows stay NULL (no code required).
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "securityCode" TEXT;
