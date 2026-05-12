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
- Crew notes currently save through a server-memory store with local browser fallback.

The note flow is usable for development and UI integration, but it is not yet production-grade shared persistence. The next hardening step is swapping the in-memory notes store for a hosted database.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

## Next implementation slices

1. Replace the interim note store with real shared persistence.
2. Ingest actual tracker checkpoint arrivals into the route timeline.
3. Add richer weather context for overnight crew decisions and exposed locations.
