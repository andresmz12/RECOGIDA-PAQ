#!/bin/bash

echo "Starting build process..."

# Step 1: Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate || exit 1

# Step 2: Run migrations if DATABASE_URL exists
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️ Running database migrations..."
  npx prisma migrate deploy || {
    echo "⚠️ Migration failed, but continuing build..."
  }
else
  echo "⚠️ DATABASE_URL not set, skipping migrations"
fi

# Step 3: Build Next.js
echo "🔨 Building Next.js application..."
next build || exit 1

echo "✅ Build completed successfully!"
