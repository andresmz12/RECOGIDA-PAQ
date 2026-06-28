CREATE TABLE "Pricing" (
  "id"              TEXT NOT NULL,
  "country"         TEXT NOT NULL,
  "packageType"     TEXT NOT NULL,
  "basePrice"       DOUBLE PRECISION NOT NULL,
  "weightThreshold" DOUBLE PRECISION NOT NULL DEFAULT 20,
  "weightRate"      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "active"          BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Pricing_country_packageType_key" ON "Pricing"("country", "packageType");
