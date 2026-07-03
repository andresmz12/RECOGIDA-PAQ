-- Record when a user accepted the Terms and Conditions (legal proof of acceptance)
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
