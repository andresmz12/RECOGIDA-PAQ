# RECOGIDA-PAQ - O'Globo Cargo Pickup Request Platform

MVP web platform for managing international package pickup requests. Customers can request pickups, track their requests, and internal staff can manage, assign, and update pickup statuses.

## Features

### Public Routes
- **Landing Page** (`/`) - Service overview with CTA
- **Pickup Request Form** (`/recoger`) - Guest form to create requests with optional account creation
- **Public Tracking** (`/rastreo/[code]`) - Track requests by code without login

### Customer Features
- **Account Dashboard** (`/mi-cuenta`) - View all personal pickup requests
- **Tracking History** - Monitor status updates via email and web

### Staff Dashboard (Admin/Dispatcher/Courier)
- **Request Management** - View, filter, and update pickup requests
- **Status Updates** - Change request status with email notifications to customers
- **Courier Assignment** - Assign requests to couriers
- **Audit Trail** - Complete history of all status changes

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Email**: SendGrid
- **Deployment**: Railway

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Fill in `.env` with:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Random secret (run: `openssl rand -base64 32`)
   - `NEXTAUTH_URL`: http://localhost:3000 (for local dev)
   - `SENDGRID_API_KEY`: Your SendGrid API key
   - `SENDGRID_FROM_EMAIL`: Authenticated email address

3. **Database Setup**
   ```bash
   npx prisma migrate dev
   ```

4. **Run Dev Server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Database Schema

### User
- Roles: CUSTOMER, ADMIN, DISPATCHER, COURIER
- Stores credentials for login + profile info

### PickupRequest
- Tracks all customer pickup requests
- Statuses: PENDING → ASSIGNED → SCHEDULED → PICKED_UP (or CANCELLED)
- Links to customer (User) and assigned courier (User)

### StatusHistory
- Audit trail: records every status change
- Includes who changed it and when
- Optional notes on updates

## API Routes

### Public
- `POST /api/pickup-requests` - Create new request
- `GET /api/track/[code]` - Track by code

### Protected (Staff)
- `GET /api/pickup-requests` - List with filters
- `GET /api/pickup-requests/[id]` - Request details
- `PATCH /api/pickup-requests/[id]` - Update status/assignment

### Auth
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth routes

## Deployment

See [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) for step-by-step Railway deployment instructions.

### Key Points
- All secrets in environment variables (never hardcoded)
- Migrations run automatically on build
- SendGrid domain must be authenticated
- PostgreSQL plugin provides DATABASE_URL

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Staff dashboard pages
│   ├── login/            # Auth pages
│   ├── recoger/          # Pickup form
│   ├── rastreo/          # Tracking
│   ├── mi-cuenta/        # Customer account
│   └── layout.tsx        # Root layout
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── email.ts         # SendGrid utilities
│   ├── prisma.ts        # Prisma client instance
│   └── utils.ts         # Helper functions
├── prisma/
│   └── schema.prisma    # Database schema
├── middleware.ts         # Route protection
└── types/               # TypeScript definitions
```

## Email Notifications

Automated emails sent via SendGrid for:
1. **Pickup Confirmation** - When request is created
2. **Status Updates** - When status changes (ASSIGNED, SCHEDULED, PICKED_UP)

Templates include:
- Tracking code and link
- Current/estimated pickup date
- Special notes from staff

## Security

- Passwords hashed with bcryptjs
- JWT-based sessions
- Role-based middleware for route protection
- No API keys hardcoded (all in environment variables)
- CSRF protection via NextAuth

## Performance Considerations

- Prisma with connection pooling ready for Railway
- Database indexes on frequently queried fields (email, trackingCode, status)
- API responses paginated (limit=20 default)
- Middleware protects routes before rendering

## Contributing

This is a greenfield MVP. For additional features:
1. Follow existing patterns for new routes
2. Always add StatusHistory entries for state changes
3. Send email notifications for customer-facing updates
4. Add role checks in middleware for staff-only routes

## License

Proprietary - O'Globo Cargo
