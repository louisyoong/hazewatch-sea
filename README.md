# HazeWatch SEA

An interactive Southeast Asia haze outlook prototype designed around Google Maps Platform.

## Run locally

Put your Google Maps key and Map ID in `.env` (copy `.env.example`):

```bash
GOOGLE_MAPS_API_KEY=AIza...
GOOGLE_MAPS_MAP_ID=your-map-id   # optional, defaults to DEMO_MAP_ID
```

Then start the server, which serves the app and injects `.env` values as `/config.js`:

```bash
npm run serve        # http://localhost:4173
```

For static hosting (e.g. the `dist/` folder), run `npm run config:dist` to write `dist/config.js` from `.env`. The key is still visible to browsers — that's normal for Maps JavaScript keys — so restrict it by HTTP referrer.

**Google Maps is the default.** With a key in `.env` the app opens straight onto the live Google map. Without a key (or with `?demo` in the URL) it shows an offline map, which draws real coastlines offline from `data/world-land.json` (Natural Earth, 1:50m for Asia-Pacific and 1:110m elsewhere; public domain) — drag to pan, scroll to zoom. Enable these APIs in the same Google Cloud project:

- Maps JavaScript API — vector map, Advanced Markers, animated camera (`moveCamera`)
- Air Quality API — heatmap tiles, `currentConditions:lookup`, `forecast:lookup`
- Weather API — live wind per city (drives the wind particle layer)
- Places API (New) — autocomplete search for any place in Southeast Asia
- Geocoding API — names for pins dropped by clicking the map

Only the Maps JavaScript API and Air Quality API are required; the others degrade gracefully.
The key is read only from `.env`. Add `?demo` to the URL to force the offline map.

## AI chat (Gemini)

Click **✦ Ask AI** (or press `/`) and ask things like *"Which areas are serious right now?"* or *"Where will haze be worst in 24 hours?"*. Gemini answers from the live readings on the map and returns the serious areas as structured JSON; the app draws each area as a polygon (a smooth hull around its cities and nearby fire hotspots, coloured by peak AQI) on the 2D, satellite, 3D and offline maps, and jumps the forecast slider to the hour asked about.

- Add `GEMINI_API_KEY` (from https://aistudio.google.com/apikey) to `.env`; optionally `GEMINI_MODEL` (default `gemini-3.8-flash`).
- The Gemini key stays on the server: the browser calls `POST /api/chat` on `server.mjs`, which calls Gemini. Restart `npm run serve` after pulling this change.
- Without a Gemini key (or on static hosting) the chat falls back to an offline rule-based analysis, labelled as such, so the demo still works.
- The server rate-limits to 12 questions per minute per visitor.

## Presenting (DevFest demo)

| Key | Action |
| --- | --- |
| `T` | Guided demo tour (camera fly-through with captions) — `Esc` stops it |
| `Space` | Play / pause the 48-hour forecast |
| `V` | Cycle map view: 2D → 3D (Photorealistic 3D Maps) → Satellite |
| `A` | Show all locations in the current filter (fit map + expand list) |
| `C` | Country filter — multi-select countries or whole regions |
| `1` / `2` | AQI / PM2.5 heatmap tiles |
| `W` / `F` | Toggle wind flow / fire hotspots |
| `I` | API inspector — shows every Maps Platform request live |
| `G` | Fly back to the regional overview |
| `⌘K` | Search (local cities + Google Places) |
| `/` | Ask AI (Gemini chat that outlines serious areas) |
| `?` | Show shortcuts |

**Photorealistic 3D is the default live view** (Google 3D Maps, `Map3DElement`): it opens with a fly-in from orbit; selecting a city flies down to street level and orbits it, with a translucent haze layer coloured and thickened by that city's AQI. At regional scale each city is an extruded column whose height and colour show US AQI (Air Quality heatmap tiles are 2D-only). If 3D doesn't load on your key, the app falls back to a tilted vector map; try `?v=beta` or check that the Map Tiles API is enabled.

Click anywhere on the live map to fetch air quality, forecast, wind and health advice for that exact point.

Tip: keep a second tab open with `?demo` as an offline fallback if venue Wi-Fi fails.
Fire hotspots are illustrative (not live satellite detections).

For production, restrict the browser key to approved website referrers and only the APIs it needs. Use a separate server-side key for web-service calls such as forecast lookups.

## Product roadmap

1. **Live intelligence** — Google Air Quality current conditions, PM2.5 heatmap tiles, weather/wind feeds, ASEAN fire-hotspot sources, station freshness and confidence.
2. **Forecasting** — 24–96 hour haze plume outlook, playback, uncertainty bands, model comparison, and source-region attribution.
3. **Personal relevance** — saved locations, exposure-aware commute windows, health profiles, multilingual advisories, push/email/WhatsApp alerts.
4. **Operations** — state/country dashboards, threshold rules, embeddable widgets, PDF/CSV briefs, incident annotations, and API access.
5. **Trust** — source provenance, last-updated times, methodology, AQI-standard switcher, data-gap indicators, audit log, accessibility and low-bandwidth mode.

The sample values in demo mode are illustrative and must not be used for health or operational decisions.
