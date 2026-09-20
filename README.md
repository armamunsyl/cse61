# CSE 61 D Academic Schedule Portal

A full MERN first version for Metropolitan University CSE 61, Section D. It shows weekly classes from a reusable routine template, date-specific class changes, approved assessments, public event requests, and a protected admin dashboard.

## Features

- Public weekly academic calendar from 9:00 AM to 6:00 PM in Asia/Dhaka time.
- Routine classes are stored once as weekly templates.
- Date-specific exceptions can suspend or modify one class without changing future weeks.
- Public users can propose quizzes, CTs, presentations, vivas, suspensions, or custom events.
- Admins can log in, review requests, edit before approval, approve, reject, create events, delete events, and manage routine slots.
- Assessment load counts show same-day and same-week pressure.
- Time conflict checks warn users and admins without blocking approval.
- Upcoming approved assessments are listed separately.
- Secure admin password hashing, JWT auth through httpOnly cookies, input validation, rate limits, and basic HTML sanitization.
- Activity history records important admin actions.
- Installable PWA with custom service worker, Web Push notifications, and native app badge support where available.

## Project Structure

- `client/` - React, Vite, Tailwind frontend.
- `server/` - Express API, Mongoose models, controllers, services, tests, and seed script.
- `server/src/services/calendarService.js` - routine expansion, exceptions, assessment counts, conflicts.
- `server/src/models/` - MongoDB data models.
- `server/src/routes/` - public, auth, and admin REST routes.

## Requirements

- Node.js 20+
- MongoDB running locally or a MongoDB Atlas URI

To start a local MongoDB with Docker:

```bash
docker compose up -d
```

## Install

```bash
npm install
```

## Environment

Create `server/.env` from `server/.env.example`:

```bash
cp server/.env.example server/.env
```

Set these values:

- `MONGO_URI` - MongoDB connection string.
- `JWT_SECRET` - long random secret for signing admin sessions.
- `CLIENT_ORIGIN` - frontend URL, usually `http://localhost:5174`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` - first admin credentials used by the seed command.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` - Web Push credentials.

Generate VAPID keys with:

```bash
npx web-push generate-vapid-keys
```

Use a real contact email for `VAPID_SUBJECT`, for example:

```bash
VAPID_SUBJECT=mailto:your-email@example.com
```

Never expose `VAPID_PRIVATE_KEY` to the frontend. Only the public key is served by `GET /api/push/public-key`.

## Seed Admin And Sample Data

```bash
npm run seed
```

The seed is safe to re-run. It creates the configured admin only if missing and inserts sample routine/events only when those collections are empty.

## Development

```bash
npm run dev
```

Frontend: `http://localhost:5174`  
API: `http://localhost:8000`

## Production Build

```bash
npm run build
```

The frontend build is emitted in `client/dist`. Run the API with:

```bash
npm start -w server
```

## PWA Installation

The React app is configured as an installable PWA through `vite-plugin-pwa` with a custom service worker.

Production deployment must use HTTPS for installability and push notifications. `localhost` works as a development exception.

PWA assets include:

- `manifest.webmanifest`
- `sw.js`
- favicon
- Apple touch icon
- 192x192 app icon
- 512x512 app icon
- maskable 512x512 icon

The service worker precaches the app shell and static assets. API routes under `/api/*` use network-only behavior so old schedule data is not shown from stale cache.

## Push Notifications

Users must enable notifications from the in-app notification settings button. The app does not request notification permission automatically on page load.

Public push endpoints:

- `GET /api/push/public-key`
- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`
- `POST /api/push/mark-read`
- `GET /api/push/status`

Admin-only test endpoint:

- `POST /api/admin/push/test`

Push subscriptions are stored per device/browser in MongoDB. Each subscription tracks:

- endpoint
- public subscription keys
- unread count
- enabled state
- user agent/platform
- last seen date
- last notification date

Notification sending is centralized in `server/src/services/pushService.js`.

Notifications trigger when:

- Admin directly creates a new approved assessment/event.
- Admin approves a pending event request.
- Admin updates important assessment fields like date, time, marks, syllabus, or type.
- Admin deletes/cancels an approved event.
- Admin sends a protected test notification.

Duplicate pushes are prevented with `NotificationLog` dedupe keys such as:

- `event-created:<eventId>`
- `event-updated:<eventId>:<version>`
- `event-cancelled:<eventId>`

If a browser push endpoint expires with `404` or `410`, the subscription is disabled without breaking the broadcast.

## App Badges

The server keeps `unreadCount` per push subscription. Each push increments that count and includes it in the push payload.

The service worker attempts to call the native badge API only when supported:

- `registration.setAppBadge(count)` in the service worker
- `navigator.setAppBadge(count)` in the app window
- `navigator.clearAppBadge()` when read

No fake badge UI is used.

On Android, numeric badges are launcher/platform dependent. The app relies on normal notification behavior, notification dots, and launcher support.

Unread state clears when the app successfully loads schedule/month/assessment data and calls `POST /api/push/mark-read`.

## Android Setup

1. Deploy the app over HTTPS.
2. Open the production URL in Chrome or another compatible Android browser.
3. Install the PWA when prompted, or use browser menu → Install app.
4. Open the installed app.
5. Tap the notification settings button.
6. Tap `Enable Notifications`.
7. Allow notification permission.
8. Create or approve an assessment from admin.
9. Close/background the app.
10. Confirm the notification appears.
11. Tap the notification and confirm it opens the app, usually `/assessments`.
12. Confirm the launcher notification dot/badge behavior according to the Android launcher.

## iPhone/iPad Setup

Requirement: iOS/iPadOS 16.4 or newer.

1. Deploy the app over HTTPS.
2. Open the site in Safari or a compatible browser.
3. Tap Share.
4. Tap Add to Home Screen.
5. Open the installed CSE 61D app from the Home Screen.
6. Tap the notification settings button.
7. Tap `Enable Notifications`.
8. Allow notification permission.
9. Create or approve an assessment from admin.
10. Close/background the installed app.
11. Confirm push notification delivery.
12. Confirm app icon badge behavior if supported by the OS.
13. Open the app and confirm unread/badge state clears after data loads.

If iPhone/iPad users try to enable notifications inside a normal browser tab, the app shows instructions to add it to the Home Screen first instead of requesting permission.

## Testing Notifications

For device setup testing, log in as admin and use `Send Test Notification` in the admin dashboard.

The test notification sends:

- Title: `CSE 61 D`
- Body: `Notifications are working.`

This action is admin-protected and is not exposed as a public broadcast endpoint.

## Troubleshooting

- Push does not work on production: verify HTTPS and VAPID keys.
- iPhone does not show permission prompt: install the app to Home Screen first and use iOS/iPadOS 16.4+.
- Notifications are blocked: reset browser/system notification permissions.
- No subscribers receive pushes: users must enable notifications from the app first.
- Old UI appears after deployment: close/reopen the app. The service worker uses auto-update and cleanup for outdated caches.
- Badge does not show on Android: launcher support varies; Android uses platform notification dots/badges.
- Private key exposed accidentally: rotate VAPID keys and update deployment env vars.

## Verification

```bash
npm run lint
npm test
npm run build
npm audit --workspaces
```

The included tests cover routine expansion, single-date suspensions, duplicate approval protection logic, unauthorized admin access, upcoming assessment sorting, assessment pressure counts, conflict detection, push subscription upsert/disable/read behavior, notification dedupe, expired subscription cleanup, and push failure isolation.
