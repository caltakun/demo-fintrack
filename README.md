# FinTrack – Financial Tracker System

FinTrack is a browser-based **Personal Finance Management System** designed to help users record, organize, monitor, and review their personal finances in one dashboard.

> 📘 **[Open the FinTrack User Guide](docs/index.html)** — complete step-by-step instructions for using the system.

## Overview

FinTrack provides modules for:

- Dashboard and financial summaries
- Income tracking
- Expense tracking
- Savings goals
- Investments
- Accounts & wallets
- Debt management
- Recurring transactions
- Financial protection
- Reports & analytics
- User settings and profile management
- Backup and restore
- CSV report export
- User registration and login
- Admin account management
- Activity/audit logging

The interface is responsive and includes a mobile sidebar/menu for smaller screens.

## Quick Start

### Option 1 – Open directly

1. Extract the project ZIP.
2. Open `index.html` in a modern browser.
3. Sign in using the demo administrator account or create a new account.

### Demo Administrator

- **Username:** `admin`
- **Email:** `admin@fintrack.local`
- **Password:** `admin1`

For security, change the password after first use if this system is being used beyond demonstration purposes.

### Option 2 – Run with a local web server

For a more reliable development setup, serve the project folder through a local web server.

Examples:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

## Important Data Behavior

FinTrack currently stores application data in the browser's **localStorage/sessionStorage**. It does not use a remote database or server-side API.

This means:

- Data is specific to the browser/device where it was entered.
- Clearing browser site data can remove stored financial information.
- Data is not automatically synchronized between devices.
- Use **Settings → Backup & reset → Export Backup** regularly.
- Import a previously exported JSON backup to restore an account's data.

## Main Workflow

A recommended workflow is:

1. Sign in or create an account.
2. Set your display name, currency, and monthly budget.
3. Add your bank, wallet, cash, or other accounts.
4. Record income.
5. Record expenses.
6. Create savings goals and add savings contributions.
7. Add investments and update their current values.
8. Record debts and payment information.
9. Complete the Protection Checklist and add protection records.
10. Review Dashboard and Reports & Analytics.
11. Export CSV reports when needed.
12. Export a JSON backup regularly.

## Protection Checklist

The Protection module includes:

- Emergency Fund
- Health Insurance
- Life Insurance
- Income Protection
- Others

Selecting a protection checklist item automatically recognizes that protection category. When an existing protection record matches a checklist category, its checkbox appears selected.

For detailed instructions, see [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md).

## Security Notes

This project includes client-side authentication features such as:

- Account registration
- Password requirements
- Login attempt limiting
- Session timeout
- Logout
- Password change
- Separate user data storage

However, this is still a **client-side/browser application**. It should not be treated as production-grade secure financial software because credentials and application data are stored locally in the browser.

For production deployment, migrate authentication and financial data to a secure backend with:

- Server-side authentication
- Password hashing
- HTTPS
- Secure sessions/tokens
- Database access controls
- Server-side authorization
- Input validation
- Audit logging
- Encryption and secure backup procedures

## Project Structure

```text
FinTrack-System/
├── index.html
├── README.md
├── docs/
│   ├── index.html
│   ├── USER_GUIDE.html
│   └── USER_GUIDE.md
└── assets/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Technology

- HTML5
- CSS3
- JavaScript
- Browser Local Storage / Session Storage
- Responsive CSS
- No external backend required for the current version

## Recommended Next Improvements

For a more professional production-ready version:

1. Connect the system to a real database.
2. Implement secure server-side authentication.
3. Add role-based permissions.
4. Add server-side validation.
5. Add automatic scheduled backups.
6. Add PDF financial reports.
7. Add monthly/yearly financial trends.
8. Add recurring transaction automation.
9. Add notifications and reminders.
10. Add stronger mobile navigation and accessibility testing.
11. Add import validation and backup version migration.
12. Add deployment configuration and environment variables.

## Documentation

### User Guide

For the easiest reading experience, open the **[FinTrack Web User Guide](docs/index.html)**. It is a responsive, print-friendly documentation page that works when the project is deployed as a website.

You can also view the **[Markdown User Guide](docs/USER_GUIDE.md)** directly in GitHub. If GitHub's Markdown viewer temporarily shows an “Error loading page” message, use the Web User Guide instead.

### Documentation files

- **[Web User Guide](docs/index.html)** — recommended for end users
- **[Markdown User Guide](docs/USER_GUIDE.md)** — recommended for GitHub/developer documentation
- **[HTML User Guide](docs/USER_GUIDE.html)** — standalone copy of the web guide
