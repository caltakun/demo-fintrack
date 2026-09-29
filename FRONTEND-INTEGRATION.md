# Frontend integration

The existing FinTrack UI can remain. The storage/auth layer is what needs to change.

Current logical browser data:
- users
- income
- expenses
- goals
- investments
- protection
- accounts
- debts
- recurring
- audit
- settings

The new API exposes the same logical model from PostgreSQL.

Recommended order:

1. Load `assets/js/database-client.js` before `app.js`.
2. Replace client-side login validation with `FinTrackDB.login(identifier,password)`.
3. Replace registration with `FinTrackDB.register(displayName,email,password)`.
4. After login call `FinTrackDB.load()` and populate the existing `data` and `settings` objects.
5. During first migration call `FinTrackDB.sync(data)`.
6. Keep localStorage only for non-sensitive UI preferences such as dark mode.
7. Later, replace full synchronization with incremental CRUD endpoints for transactions, savings, investments, protection, accounts, debts and recurring transactions.

The backend already enforces user ownership using the authenticated session, so one user's records cannot be requested simply by changing an email or user id in the browser.
