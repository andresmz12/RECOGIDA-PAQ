-- A case must be openable even for guest pickups without a linked
-- customer account — customerId is now optional.
ALTER TABLE "Case" ALTER COLUMN "customerId" DROP NOT NULL;
