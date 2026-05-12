# BGR Crew Dashboard

Mobile-first dashboard for Eugene's Bob Graham Round attempt. The app is designed for crew phones during race day and currently includes:

- Embedded live tracker panel with direct tracker link fallback.
- Fell-top timeline with planned ETA and placeholders for actual tracker arrivals.
- Changeover timing cards with runner notes and editable crew notes.
- Open-Meteo weather snapshots for key crew locations.
- Pacer schedule by leg.
- Seeded route, schedule, and crew-point data from the published planning spreadsheet.

## Current state

The first implementation slice is working and production-build clean.

- `GET /api/weather` returns normalized Open-Meteo weather data for key crew locations.
- `GET /api/notes` and `POST /api/notes` provide the initial note API shape.
- Crew notes now persist through Vercel Postgres when `POSTGRES_URL` is configured.
- Local development falls back to a backend JSON file at `.data/crew-notes.json` so notes survive refreshes and server restarts.

For production deployments, configure `POSTGRES_URL` before using the crew notes API. The table definition is in `db/schema.sql` and the app will create the table on first use if it does not already exist.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To test shared durable notes locally against a database, set `POSTGRES_URL` in your environment before starting the app.

## Validation

```bash
npm run lint
npm run build
```

## Next implementation slices

1. Add a lightweight shared crew edit PIN and rate limiting for public note writes.
2. Ingest actual tracker checkpoint arrivals into the route timeline.
3. Add richer weather context for overnight crew decisions and exposed locations.
