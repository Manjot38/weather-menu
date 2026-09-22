# Weather Menu — weather based food suggestions

Search any city, the page fetches its current weather from OpenWeatherMap, and the menu
reorders itself: cold drinks and ice cream when it is hot, chai and pakora when it rains.

Plain HTML, CSS and vanilla JS — no framework, no build step, no `node_modules` for the
frontend. One Vercel serverless function (`api/weather.js`) exists purely so the
OpenWeatherMap API key stays on the server.

## Setting the API key

The key is **never** in the frontend and is never committed — `.gitignore` covers `.env`.

Local:

```bash
cp .env.example .env
```

Then open `.env` and put your key after the `=`:

```
OPENWEATHER_API_KEY=your_key_here
```

On Vercel, add the same variable under **Project → Settings → Environment Variables**
instead of deploying a `.env` file.

## Running it

Because of the serverless route, `python -m http.server` is **not** enough here — it would
serve `index.html` fine but return 404 for `/api/weather`, so the page would sit in its
error state (with the full menu still working). Use the Vercel dev server, which serves the
static files *and* the function, and loads `.env` automatically:

```bash
npx vercel dev
```

Then open the URL it prints (usually <http://localhost:3000>).

Check the endpoint on its own:

```bash
curl "http://localhost:3000/api/weather?city=ludhiana"
```

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page shell: city search → weather card → recommended grid → all products |
| `assets/js/data.js` | `window.WM_DATA` — suggestions, categories, the 22 menu items, and the five weather rules |
| `assets/js/app.js` | Handles the search, fetches weather, picks a rule, ranks and renders |
| `assets/css/main.css` | Design tokens, weather card, product card grid, loading/error states |
| `api/weather.js` | `GET /api/weather?city=<name>` — server side OpenWeatherMap proxy |

## City lookup

Any city can be typed into the search box — there is no fixed city list. The name is sent
to `/api/weather`, which resolves it with OpenWeatherMap's **Geocoding API**
(`/geo/1.0/direct`) and then fetches the current weather for the coordinates that come
back. Two upstream calls per lookup, both server side.

`WM_DATA.suggestions` in `assets/js/data.js` is convenience only — it fills the
autocomplete list and the quick pick chips. Editing it does not restrict what can be
searched.

Input is validated before the key is used: 2–60 characters, and letters, marks, spaces and
`' . , ( ) -` only, so names like `Malmö`, `N'Djamena` and `Vitry-sur-Seine` work while
anything script-, URL- or path-shaped is rejected with a 400. A name that resolves to
nothing gives a 404 and the page says it could not find that city.

## The rules

`assets/js/data.js` holds them; each lists its categories strongest-match-first.

| Weather | Recommended, in order | Demo deal |
| --- | --- | --- |
| Rain / Drizzle / Thunderstorm | Tea & coffee, fried snacks, soups | 10% off pakora |
| ≥ 30 °C | Cold drinks, ice cream & shakes, juices | 10% off cold drinks |
| 24–29 °C | Cold drinks, juices, light snacks | 10% off juices |
| 15–23 °C | Tea & coffee, light snacks, noodles, soups | 10% off tea & coffee |
| < 15 °C | Tea & coffee, soups, fried snacks | 10% off soups |

Rain is matched on the weather condition and takes priority over the temperature bands.

The discount is a **demo business rule** — it is applied at render time only. Prices in
`data.js` are never modified and there is no order or checkout flow here.

To change the menu, edit the `products` array in `assets/js/data.js`; every item's
`category` must be one of the slugs in `categories`.

## Behaviour when the weather fails

By design the product list never depends on the API. On any failure — no key, bad key,
unknown city, timeout, offline — the weather card shows the reason with a **Try again**
button and the full menu renders in its normal order.

Successful lookups are cached in `sessionStorage` for 10 minutes per city, so repeat
searches are instant and stay well inside the free API tier. The last search is kept in
`localStorage` so a reload restores it.
