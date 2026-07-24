# Play Store listing — copy & checklist

Reference material for filling out the Play Console listing. Nothing here
is submitted automatically — paste it into the Play Console yourself.

## App details

- **App name:** O'Globo Cargo
- **Package name:** `com.oglobocargo.app`
- **Category:** Business (alternative: Maps & Navigation, or Travel & Local)
- **Contact email:** (use your support inbox)
- **Privacy policy URL:** `https://recogida-paq-production.up.railway.app/privacidad`
- **Website:** `https://recogida-paq-production.up.railway.app`

## Short description (max 80 characters)

> International package pickups — request, track, and manage in real time.

## Full description (max 4000 characters)

```
O'Globo Cargo — International logistics, simplified.

Request a pickup for your international package in minutes, track it in
real time, and manage your shipments from one place.

FOR CUSTOMERS
• Request a pickup without creating an account
• Track your shipment status with a tracking code
• Save recipients and pickup addresses for faster requests next time
• Get email updates and a confirmation call when your pickup is scheduled
• Chat directly with support if you have a question

FOR OUR OPERATIONS TEAM
• Manage pickup requests, routes, and couriers from a single dashboard
• Assign and track couriers in real time on the route map
• Confirm deliveries with a pickup security code for extra security
• Handle customer cases (lost, damaged, or delayed packages) end to end

O'Globo Cargo connects customers shipping packages abroad with a
dispatch team and courier network that gets them picked up, verified,
and on their way — with visibility at every step.
```

## Data safety section (Play Console → App content → Data safety)

Map to what the app actually collects (see `app/privacidad/page.tsx` for
the full policy). Answer the questionnaire per this table:

| Data type | Collected? | Shared? | Purpose |
|---|---|---|---|
| Name | Yes | Yes (couriers, ZyraVoice for calls) | App functionality, account management |
| Email address | Yes | Yes (SendGrid) | App functionality, communications |
| Phone number | Yes | Yes (couriers, ZyraVoice) | App functionality, communications |
| Physical address | Yes | Yes (couriers) | App functionality (pickup/delivery) |
| Precise location | Only if user grants permission | No | App functionality (route map) — optional, not required to use the app |
| Photos | Yes (delivery proof, courier-taken) | No | App functionality |
| App activity / in-app messages | Yes (support chat) | No | Customer support |
| User IDs / device IDs | No | — | — |
| Financial info | No (declared shipment value only, not payment info) | — | — |

Declare: data is encrypted in transit (HTTPS), users can request account
deletion (see Privacy Policy §6).

## Store graphics (already generated in `assets/play-store/`)

- `icon-512.png` — 512×512 app icon
- `feature-graphic.png` — 1024×500 feature graphic

**Still needed before submitting** (not generated here — these should be
real screenshots from the running app on a device or emulator):
- At least 2 phone screenshots (recommended: landing page, pickup request
  form, tracking page, courier dashboard)
- Optional: 7-inch and 10-inch tablet screenshots

## Content rating

Complete the questionnaire in Play Console → App content → Content
rating. This app has no user-generated public content, no violence, no
mature content — should qualify for "Everyone" / PEGI 3 in most regions.

## Target audience

Not designed for or targeted at children. Select the appropriate age
range in Play Console → App content → Target audience (13+ recommended,
since account creation requires contact information).

## Release checklist

1. Build a signed AAB via the "Build signed Android AAB" GitHub Actions
   workflow (`.github/workflows/android-release.yml`).
2. Create the app in Play Console, fill in the listing using this doc.
3. Upload the AAB to an internal testing track first.
4. Complete Data safety, Content rating, Target audience, and the App
   content declarations.
5. Once internal testing passes, promote to closed testing / production.
