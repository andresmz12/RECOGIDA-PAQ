-- Lets a courier flag "customer wasn't there" at pickup time without
-- forcing it into an unrelated existing type (LOST/DAMAGED/etc. describe
-- problems with the shipment itself, discovered later, not a failed pickup
-- attempt).
ALTER TYPE "CaseType" ADD VALUE IF NOT EXISTS 'NOT_HOME';
