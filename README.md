# FinTrack — Admin Dashboard Repair

This build repairs the Admin Dashboard version of FinTrack.

## Fixed
- Restored the Savings Goals dashboard container (`goalList`) that was accidentally corrupted during the Admin Dashboard-only edit.
- Fixed the broken HTML structure that prevented the JavaScript from finishing initialization, which caused the login form not to respond.
- Added the missing `getUserData()` helper required by the admin financial-record counter.
- Kept the Admin Dashboard separate from the normal financial dashboard.
- Admin Dashboard shows:
  - Total users
  - Total financial records
  - Number of admin accounts
  - Account Management
  - Delete individual users
  - Delete all regular users
  - Activity Log
- Normal users continue to receive the regular financial dashboard.

## Admin access
Username: `admin`
Password: `admin1`
Email: `admin@fintrack.local`

## Note
This remains a local-browser application. Authentication and authorization are stored in browser storage and are intended for local/demo use, not production security.
