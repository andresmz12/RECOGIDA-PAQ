# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RECOGIDA-PAQ** is an international package pickup request platform for O'Globo Cargo. It allows customers to request pickups, track requests, and internal staff to manage operations. The system is being adapted for the US market.

## Development Commands

### Setup
```bash
npm install
npx prisma migrate dev  # Run migrations and generate Prisma client
```

### Development
```bash
npm run dev             # Start dev server on http://localhost:3000
npm run lint            # Run ESLint
npm run prisma:generate # Generate Prisma client without running migrations
```

### Database
```bash
npx prisma migrate dev        # Create and apply migrations
npx prisma migrate deploy     # Apply migrations in production
npx prisma studio             # Open database GUI
node scripts/create-test-users.js  # Seed test users (for local development)
```

### Build & Production
```bash
npm run build   # Build Next.js application (uses scripts/build.js)
npm start       # Start production server (uses scripts/start.js)
```

The build/start scripts handle:
- Generating Prisma client with dummy DATABASE_URL (build time)
- Running migrations automatically (startup)
- Creating test users on first run (startup)

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 with TypeScript
- **Auth**: NextAuth.js v4 with credentials provider
- **Database**: PostgreSQL with Prisma ORM
- **Email**: SendGrid
- **Styling**: Tailwind CSS
- **Deployment**: Railway

### Directory Structure
```
app/
├── api/                    # API routes (all POST/GET endpoints)
│   ├── auth/register      # User registration
│   ├── auth/[...nextauth] # NextAuth handler
│   ├── pickup-requests    # Pickup CRUD operations
│   ├── track/[code]       # Public tracking endpoint
│   ├── admin/users        # Admin user management
│   └── setup/admin        # Initial admin creation
├── dashboard/             # Staff routes (protected)
│   ├── page.tsx          # Main dashboard
│   ├── solicitudes/       # Request management
│   ├── usuarios/          # User management (ADMIN only)
│   ├── mis-recogidas/     # Courier's pickup list
│   └── mapa/              # Map view
├── login/                 # Login page
├── registro/              # Registration page
├── recoger/               # Public pickup request form
├── rastreo/[code]/        # Public tracking page
├── mi-cuenta/             # Customer dashboard (protected)
├── setup/                 # Initial setup (create first admin)
└── layout.tsx             # Root layout

lib/
├── auth.ts               # NextAuth configuration & callbacks
├── email.ts              # SendGrid email templates
├── prisma.ts             # Prisma client singleton
└── utils.ts              # Helper functions (tracking code generation, date formatting)

prisma/
├── schema.prisma         # Database schema (User, PickupRequest, StatusHistory)
└── migrations/           # Prisma migrations

middleware.ts            # Route protection middleware for /dashboard and /mi-cuenta
```

### Key Data Models

**User**
- Roles: CUSTOMER, ADMIN, DISPATCHER, COURIER
- Password is hashed with bcrypt (10 salt rounds)
- Email is unique constraint

**PickupRequest**
- Statuses: PENDING → ASSIGNED → SCHEDULED → PICKED_UP (or CANCELLED)
- Linked to customer (userId) and assigned courier (assignedCourierId)
- Public tracking via unique trackingCode

**StatusHistory**
- Audit trail: every status change is recorded
- Includes who changed it, when, and optional notes
- Automatically created when requests are created or updated

### Authentication & Authorization

**NextAuth Configuration**
- Strategy: JWT-based sessions (maxAge: 30 days)
- Credentials provider: email + password
- Secret stored in NEXTAUTH_SECRET env var
- Callbacks populate JWT with user id and role

**Route Protection**
- Middleware in `middleware.ts` protects /dashboard and /mi-cuenta
- Dashboard: requires ADMIN, DISPATCHER, or COURIER
- /dashboard/usuarios: ADMIN only
- /dashboard/mis-recogidas: COURIER only
- /mi-cuenta: CUSTOMER only
- Public routes: /, /recoger, /rastreo/[code], /login, /registro, /setup

### Email System

**SendGrid Integration**
- Triggered on pickup request creation and status updates
- HTML templates in `lib/email.ts`
- Currently in Spanish (needs US adaptation)
- Includes tracking links using NEXTAUTH_URL

### Environment Variables Required

```
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET       # JWT secret (generate with: openssl rand -base64 32)
NEXTAUTH_URL          # Application URL (e.g., http://localhost:3000 or https://example.com)
SENDGRID_API_KEY      # SendGrid API key
SENDGRID_FROM_EMAIL   # Authenticated sender email address
```

### Current Issues & Limitations

1. **Language**: Entire UI is in Spanish; needs English localization for US market
2. **Test Data**: Uses Colombian phone numbers and Spanish names
3. **Date Formatting**: Spanish locale hardcoded in email templates and utils
4. **Phone Format**: No validation for US phone format
5. **Missing Components**: Some dashboard pages (mapa, usuarios detail pages) need implementation
6. **No Password Reset**: Users cannot reset forgotten passwords

## Important Implementation Notes

### Form Submissions & Account Creation

When a user submits `/api/pickup-requests` with `createAccount=true`:
1. User is created with hashed password (if email doesn't exist)
2. PickupRequest is created linked to new user
3. User is NOT automatically logged in (frontend must call signIn after)
4. StatusHistory entry is created with status PENDING

When creating users via registration form (/registro):
1. Password is hashed before sending to `/api/auth/register`
2. After successful registration, frontend auto-logs in via signIn()
3. Redirects to /mi-cuenta (customer dashboard)

### Tracking Code Generation

- Format: `OGC-XXXXXX` (6 random alphanumeric chars after prefix)
- Guaranteed unique (loop attempts up to 10 times if collision)
- Used in public tracking URLs and email templates

### Build Process

The build script (`scripts/build.js`) uses a dummy DATABASE_URL for Prisma generation because:
- Prisma client generation requires DATABASE_URL at build time
- The actual database may not be available during CI/CD build
- Runtime startup script (`scripts/start.js`) ensures real DATABASE_URL exists

## When Modifying This Codebase

### Adding New Features
- Always add StatusHistory entries for request state changes
- Send email notifications for customer-facing updates
- Add role checks in middleware for staff-only routes
- Use /api routes for backend logic, pages for frontend

### Database Changes
- Create new migrations: `npx prisma migrate dev --name feature_name`
- Update schema.prisma first, then migrate
- Migrations auto-run on production startup

### Authentication
- Never bypass NextAuth for route protection
- Always check role in middleware, not just presence of token
- Use getServerSession() in API routes for server-side validation

### Email
- Test emails locally (SendGrid requires real API key for production)
- Email sending failures should not block request completion
- Always include tracking code and contact info in customer emails
