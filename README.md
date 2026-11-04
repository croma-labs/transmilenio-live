<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/croma_brand_white.svg">
  <img alt="Croma" src="public/croma_brand_black.svg" height="26">
</picture>

# TransMilenio en vivo

**Every TransMilenio bus in Bogotá, moving on one map, right now.**

A live map built on the [Croma API](https://docs.usecroma.com/guides/colombia/transmilenio): the whole fleet gliding across the city every 15 seconds, the next buses at any station, and the path of any route. Every call shows up in an inspector you can copy from.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?project-name=transmilenio-live&repository-name=transmilenio-live&repository-url=https%3A%2F%2Fgithub.com%2Fcroma-labs%2Ftransmilenio-live&env=CROMA_API_KEY&envDescription=CROMA_API_KEY+reads+TransMilenio+through+Croma+%28free+to+get%29.&envLink=https%3A%2F%2Fplatform.usecroma.com%2Fsign-up)
&nbsp;
[![Get your Croma API key](public/croma-api-key-badge.svg)](https://platform.usecroma.com/sign-up)

</div>

---

## What's inside

- **The whole fleet, live.** Every bus on the network (2,000 at night, close to 8,000 at rush hour) from `vehicles`, drawn on the map and gliding from one reported position to the next instead of jumping.
- **Trails.** The last few positions of each bus, so the city's main corridors draw themselves.
- **Any route.** Type a code (`L18`, `B10`, `H710`): its buses light up, the rest of the fleet dims, and the route's path comes from `route` with `include_geometry`.
- **Any station.** Click one for the next buses from `stop-arrivals`: minutes away, how late or early each one runs, refreshed every 20 seconds.
- **Any bus.** Click one for its route, next stop, plate and last report, and follow it across the city.
- **Recording mode.** Press `R`: the panels go, the camera tilts and slowly turns, and a large live counter takes the corner. Made for screen recordings.
- **One snapshot for everyone.** The server reads the fleet once every 15 seconds and every visitor shares it, so the API is called the same number of times whether one person watches or a thousand. The API key never reaches the browser.
- **Validated end to end.** Zod checks every query parameter before it reaches the API and every API response before it reaches the map.
- **Crafted UI.** [shadcn/ui](https://ui.shadcn.com) on the ruled-sheet design system of the [Croma Chat Template](https://github.com/croma-labs/croma-chat-template), a [MapLibre](https://maplibre.org) map on CARTO basemaps, dark and light.

## One-click deploy

1. Click **Deploy with Vercel** above.
2. Get a free API key with the **Get your Croma API key** button.
3. Paste `CROMA_API_KEY` when Vercel asks for it.

For a public deploy, add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to limit station and route lookups to 60 per 10 minutes per IP. The fleet itself is shared and never limited.

## Running locally

```bash
git clone https://github.com/croma-labs/transmilenio-live
cd transmilenio-live
npm install

cp .env.example .env.local   # add CROMA_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## The calls

| Endpoint | Used for |
|---|---|
| `POST /co/transmilenio/vehicles/v1` | Every bus on the network, 500 per page |
| `POST /co/transmilenio/stops-search/v1` | The stations on the map (`kind: "station"`) |
| `POST /co/transmilenio/stop-arrivals/v1` | The next buses at a station |
| `POST /co/transmilenio/route/v1` | A route's path, with `include_geometry: true` |

```bash
curl https://api.croma.run/co/transmilenio/vehicles/v1 \
  -H "Authorization: Bearer $CROMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"route": "L18"}'
```

Full reference: [docs.usecroma.com/guides/colombia/transmilenio](https://docs.usecroma.com/guides/colombia/transmilenio).

## Code map

```
app/api/fleet       the shared fleet snapshot
app/api/stations    the stations, kept for six hours
app/api/arrivals    the next buses at one station
app/api/route       one route's path
lib/transit.ts      the calls to Croma and the shared snapshots
lib/schemas.ts      Zod for every response and parameter
components/bus-map  the map: layers, the glide, trails, clicks
components/panels   counter, route search, legend, bus card, inspector
```

## License

MIT. Transit data from TransMilenio S.A. via Croma; basemap © CARTO, © OpenStreetMap contributors.
