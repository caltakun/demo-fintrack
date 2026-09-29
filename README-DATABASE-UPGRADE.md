# FinTrack Database Upgrade

This is the PostgreSQL/Vercel database layer for the existing FinTrack application.

## Why this upgrade

The current public FinTrack application stores users and financial records in browser `localStorage`/`sessionStorage`, so data is tied to a browser/device rather than a central database. The current repository README also identifies this as a limitation.

## Included

- PostgreSQL relational schema
- Server-side registration/login
- scrypt password hashing
- HttpOnly/Secure session cookie
- User settings
- Income and expense transactions
- Savings goals and savings entries
- Investments
- Protection records, including `Other`
- Accounts/wallets
- Debt management
- Recurring transactions
- Audit logs
- Admin summary endpoint
- One-time browser-to-PostgreSQL synchronization endpoint
- Frontend API client

## Vercel deployment

1. Create a PostgreSQL database. Vercel currently supports database integrations such as Neon, Supabase and Prisma Postgres through its Marketplace.
2. Run `database/schema.sql` against the database.
3. Add these Vercel environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_DISPLAY_NAME`
   - `SETUP_KEY`
4. Deploy this project to Vercel.
5. Send one `POST` request to `/api/setup-admin` with header `x-setup-key` equal to your `SETUP_KEY`.
6. Add `assets/js/database-client.js` to the existing frontend and migrate the current `app.js` storage/auth functions to use it.

## Migration

The old application uses these browser structures:

- `fintrackUsers`
- `fintrackData:<user>`
- `fintrackSettings:<user>`

Use `database/migrate-browser-backup.js` in the old app to export the current account data. After signing in to the upgraded app, send the resulting JSON's `data` object to `POST /api/data/sync`.

## Important

Do not commit `.env` files, passwords, database URLs or migration backups to GitHub. The sync endpoint is intended for the initial migration; production writes should eventually use incremental API endpoints to avoid stale full-dataset overwrites.
