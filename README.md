# RECOGIDA-PAQ — O'Globo Cargo Pickup Request Platform

MVP web platform for managing international package pickup requests. Customers can request pickups, track shipments, and internal staff can manage, assign, and update pickup statuses.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 + TypeScript |
| Auth | NextAuth.js v4 (JWT) |
| Database | PostgreSQL + Prisma ORM |
| Email | SendGrid |
| Styling | Tailwind CSS |
| Maps | Leaflet + React Leaflet |
| Deployment | Railway |

## Features

### Public
- **Landing Page** (`/`) — Service overview
- **Pickup Request Form** (`/recoger`) — Guest form with optional account creation
- **Public Tracking** (`/rastreo/[code]`) — Track by code without login

### Customer (`/mi-cuenta`)
- View all personal pickup requests and status history

### Staff Dashboard (`/dashboard`)
- Request management with filters and search
- Status updates with email notifications
- Courier assignment
- Map view of active pickups
- Complete audit trail (StatusHistory)

### Admin-only
- User management (`/dashboard/usuarios`)
- Route management (`/dashboard/rutas`)

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL

# Run migrations and seed test users
npx prisma migrate dev
node scripts/create-test-users.js

# Start dev server
npm run dev
```

Visit http://localhost:3000

## Environment Variables

```
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET       # JWT secret (generate: openssl rand -base64 32)
NEXTAUTH_URL          # App URL (http://localhost:3000 for local dev)
SENDGRID_API_KEY      # SendGrid API key
SENDGRID_FROM_EMAIL   # Authenticated sender email
```

## Project Structure

```
app/
├── api/              # API routes
├── dashboard/        # Staff pages (protected)
├── login/            # Auth pages
├── registro/         # Registration
├── recoger/          # Pickup form
├── rastreo/          # Public tracking
├── mi-cuenta/        # Customer account
└── setup/            # Initial admin creation

components/
├── ui/               # Base UI components (Button, Card, Alert, etc.)
├── maps/             # Map components (MapView, MiniMap)
├── Form/             # Form components (Input, Select, AddressFields, etc.)
├── DashboardLayout.tsx
└── providers.tsx

lib/
├── auth.ts           # NextAuth config
├── email.ts          # SendGrid templates
├── prisma.ts         # Prisma client
└── utils.ts          # Helpers

docs/                 # Extended documentation
prisma/               # Schema and migrations
scripts/              # Build and startup scripts
middleware.ts         # Route protection
```

## API Routes

| Route | Method | Access | Description |
|-------|--------|--------|-------------|
| `/api/pickup-requests` | POST | Public | Create request |
| `/api/track/[code]` | GET | Public | Track by code |
| `/api/pickup-requests` | GET | Staff | List with filters |
| `/api/pickup-requests/[id]` | GET/PATCH | Staff | Details / update |
| `/api/admin/users` | GET/PATCH | Admin | User management |
| `/api/couriers` | GET | Staff | List couriers |
| `/api/stats` | GET | Staff | Dashboard stats |
| `/api/auth/register` | POST | Public | Register user |

## User Roles

| Role | Access |
|------|--------|
| CUSTOMER | `/mi-cuenta` — own requests only |
| COURIER | `/dashboard/mis-recogidas` — assigned pickups |
| DISPATCHER | `/dashboard` — all requests, courier assignment |
| ADMIN | Full access including user and route management |

## Database Schema

### PickupRequest status flow
```
PENDING → ASSIGNED → SCHEDULED → PICKED_UP
                  ↘ CANCELLED
```

Every status change is recorded in **StatusHistory** (who changed it, when, optional notes).

## Deployment

See [`docs/RAILWAY_SETUP.md`](./docs/RAILWAY_SETUP.md) for step-by-step Railway deployment.

Key points:
- `npm run build` uses a dummy DATABASE_URL for Prisma client generation
- `npm start` auto-runs migrations and seeds test users on first run
- All secrets via environment variables — nothing hardcoded

## Security

- Passwords hashed with bcryptjs (10 rounds)
- JWT sessions via NextAuth (30-day expiry)
- Role-based route protection in `middleware.ts`
- No API keys hardcoded

## License

Proprietary — O'Globo Cargo
