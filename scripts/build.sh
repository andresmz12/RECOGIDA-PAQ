#!/bin/bash

echo "Starting build process..."

# Step 1: Create .env if DATABASE_URL is not set (for Prisma compilation)
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL not set, creating dummy for build..."
  echo "DATABASE_URL=postgresql://dummy:dummy@localhost/dummy" > .env.local
else
  echo "✓ DATABASE_URL is set"
fi

# Step 2: Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate || exit 1

# Step 3: Build Next.js
echo "🔨 Building Next.js application..."
next build || exit 1

# Step 4: Run migrations if DATABASE_URL is real (not dummy)
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" != *"dummy"* ]]; then
  echo "🗄️ Running database migrations..."
  npx prisma migrate deploy || {
    echo "⚠️ Migration failed, but build completed"
  }
else
  echo "ℹ️ Skipping migrations - DATABASE_URL will be set during Railway release phase"
fi

echo "✅ Build completed successfully!"
