# DigiVanta Platform

A complete, responsive startup website and role-based business workspace built with plain HTML, CSS and JavaScript.

## Included

- Conversion-focused public website
- Dark and light themes
- Responsive desktop, tablet and mobile layouts
- Admin workspace for leads, projects, clients, services, marketing, team, finance and reports
- Developer workspace for tasks, assigned projects, resources and time tracking
- Client portal for project tracking, approvals, invoices and messages
- Working forms, filters, status changes, modal flows and browser-persisted demo data

## Run locally

Open `index.html` directly, or run a local server:

```powershell
node server.js
```

Then open `http://localhost:4173`.

Use the **Log in** button and choose Admin, Developer or Client. The demo password field accepts any value.

## Customize

Search for `DigiVanta` in `index.html` and `app.js` to update the brand name, contact details and business profile. Brand colors are defined at the top of `styles.css`.

The current version stores demo data in `localStorage`. For production, connect the same UI to your preferred backend, database, authentication, file storage and payment provider.
