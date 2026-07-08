-- Marks which StatusHistory notes are safe to expose on the public
-- tracking page (case-opened events), vs internal staff shorthand.
ALTER TABLE "StatusHistory" ADD COLUMN IF NOT EXISTS "notesArePublic" BOOLEAN NOT NULL DEFAULT false;
