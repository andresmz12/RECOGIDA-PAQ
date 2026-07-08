-- Running notes log per case, separate from the single final resolutionNotes.
CREATE TABLE IF NOT EXISTS "CaseNote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CaseNote_caseId_createdAt_idx" ON "CaseNote"("caseId", "createdAt");

DO $$ BEGIN
    ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_caseId_fkey"
        FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
