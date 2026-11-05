# Jadeite Systems · Surveyor app (mobile, Figma Make)

Clickable prototype of the **Surveyor mobile app** for Jadeite Glazing (windows, doors, bifolds, orangeries) — the surveyor's phone app on the same platform as the Office Admin, the Sales portal and the Surveyor web portal.
React 19 + Vite + TypeScript, running inside Figma Make. Phone size **375 × 812**. On a desktop it shows inside a phone frame with a "jump to" panel; on a real phone it fills the screen.

The demo is signed in as **Priya Shah** (surveyor). She only sees the visits booked for her. Demo "today" is Friday 16 Oct 2026.

## Development server
A Vite dev server is already running on `$PORT` (default 8443). Changes hot-reload in the preview.

## Structure
- `src/main.tsx` – entry: HashRouter → StoreProvider → App. Imports Sora font, `src/index.css`, `src/styles/app.css`.
- `src/App.tsx` – all routes, wrapped in the phone `Device` and a sign-in guard.
- `src/ui/kit.tsx` – phone frame, status bar, `Screen`, `Header`, bottom `TabBar` (Today, Visits, Calendar, Messages, Profile), bottom `Sheet`, toasts, Tag, Avatar, Field, Check, Switch, Seg, Steps, SignaturePad, PhotoGrid.
- `src/ui/sheets.tsx` – the pop-ups: On my way (type the arrival time), Can't make it, Customer not in, Time off, Paperwork report upload, Log a call, Message the office, the visit "more" menu.
- `src/lib/visits.ts` – my visits, statuses, alerts, conversations, the shared actions, size rules (within 5mm = same) and the 9 site checks.
- `src/pages/` – Auth (sign in, code, locked, forgot, welcome tour), Today, Visits (+ search, notifications, not-in record), Survey (visit, the 5 on-site steps, done, report, history), Inspection, Calendar, Messages (+ thread), Profile (+ details, area and days, notifications, Outlook and Framepoint, security, help).
- `src/data/` – the same sample data and shared demo state as the Surveyor web portal (saved in sessionStorage; "Reset demo data" in Profile clears it).
- `public/images` – property photos and the Jadeite J logo (relative paths like `images/house.jpg`).

## Surveyor flow (matches the agreed flow)
Office books the final survey → it appears in Today, Visits, Calendar and Outlook → On my way (type the arrival time, text to the customer) → Start survey → 1 Measure every Framepoint item (within 5mm = same) or upload the paperwork report (typed sizes are then not used) → 2 Site checks → 3 Photos → 4 Notes and customer signature → 5 Check and submit → Done → Report. All sizes the same → the office prepares the order. A size changed → the salesperson revises the quote in Framepoint first. Save and finish later at any step. Can't make it → the office moves it. Customer not in → sent back to the office to rebook. Aftercare / snag inspections: On my way → Start → cause, findings, fix, part, how soon, photos, optional signature → Submit findings.

## Design system (do not drift)
- Font: Sora (400–700). Plain CSS tokens in `src/styles/app.css` (mobile version of the platform tokens).
- Colours: primary `#00c7a1`, primary-dark `#0b6e5c`, deep `#0b1f1b`, tint `#ebf7f3`, page `#f6f8f7`, border `#e3e9e7`, text `#0f1414` / `#3a4a4a` / `#6b7a78`, ok `#1f9d5b`, warn `#e0a100`, error `#d64545` (use red sparingly).
- Sizes (keep consistent): text only 11px to 20px; buttons 48px for main actions and 40px for everything else (icon buttons, chips, tabs, Yes/No), all with 12px corners; inputs 48px; cards, notes and files have 16px corners. Bottom sheets for every pop-up. Calm, simple, jargon-free wording. Real property photos.
- Tailwind utilities are available, but Tailwind's base reset is intentionally not loaded.

## Demo sign-in
Any email · security code **482193** (3 wrong codes locks the account).

## Code quality
- Use double quotes for strings containing apostrophes, or escape them.
- Keep JSX balanced; pages export components used in `App.tsx`.
