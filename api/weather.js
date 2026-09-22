/* ==========================================================================
   GET /api/weather?city=<name>
   --------------------------------------------------------------------------
   Server side proxy for OpenWeatherMap. The API key lives only in
   process.env.OPENWEATHER_API_KEY and is never sent to the browser — the
   response below is a narrow projection, not the raw payload.

   Any city name is accepted. It is resolved with OpenWeatherMap's Geocoding
   API (no hardcoded coordinate map), then the current weather is fetched for
   the coordinates that comes back. A name that resolves to nothing is a 404
   so the page can say "we could not find that city".
   ========================================================================== */

const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const OWM_URL = 'https://api.openweathermap.org/data/2.5/weather';
const TIMEOUT_MS = 6000;

const MIN_LEN = 2;
const MAX_LEN = 60;

/* Letters (any script), marks, spaces and the punctuation that turns up in
   real place names — "Thiruvananthapuram", "Y S R District", "Delhi, IN".
   Everything else is rejected before the key is ever used. */
const CITY_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s'.,()-]*$/u;

function cleanCity(raw) {
  if (typeof raw !== 'string') return null;
  var city = raw.replace(/\s+/g, ' ').trim();
  if (city.length < MIN_LEN || city.length > MAX_LEN) return null;
  if (!CITY_RE.test(city)) return null;
  return city;
}

async function getJSON(url, signal) {
  const res = await fetch(url, { signal: signal });
  if (!res.ok) {
    const detail = await res.text().catch(function () { return ''; });
    const err = new Error('upstream ' + res.status);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return res.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, message: 'Method not allowed. Use GET.' });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error('Missing OPENWEATHER_API_KEY environment variable');
    return res.status(500).json({ success: false, message: 'Weather is not configured on the server.' });
  }

  const city = cleanCity(req.query.city);
  if (!city) {
    return res.status(400).json({ success: false, message: 'Enter a city name (2–60 letters).' });
  }

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

  try {
    /* 1. name -> coordinates */
    const matches = await getJSON(
      GEO_URL + '?q=' + encodeURIComponent(city) + '&limit=1&appid=' + encodeURIComponent(apiKey),
      controller.signal
    );

    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'We could not find “' + city + '”. Check the spelling and try again.',
      });
    }

    const place = matches[0];
    if (typeof place.lat !== 'number' || typeof place.lon !== 'number') {
      console.error('Geocoding returned no usable coordinates:', JSON.stringify(place));
      return res.status(502).json({ success: false, message: 'Could not locate that city. Please try again.' });
    }

    /* 2. coordinates -> current weather */
    const owm = await getJSON(
      OWM_URL + '?lat=' + encodeURIComponent(place.lat) + '&lon=' + encodeURIComponent(place.lon)
        + '&units=metric&appid=' + encodeURIComponent(apiKey),
      controller.signal
    );

    const current = (owm.weather && owm.weather[0]) || {};

    /* No usable temperature means we cannot classify the weather. Better to
       fail and let the page fall back than to report a misleading 0 degrees. */
    if (!owm.main || typeof owm.main.temp !== 'number') {
      console.error('OpenWeatherMap payload had no numeric main.temp:', JSON.stringify(owm));
      return res.status(502).json({ success: false, message: 'Weather data was incomplete. Please try again.' });
    }

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=600');
    return res.status(200).json({
      success: true,
      message: 'Weather fetched',
      data: {
        query: city,
        city: place.name || city,
        state: place.state || place.country || '',
        country: place.country || '',
        tempC: Math.round(owm.main.temp),
        condition: current.main || 'Unknown',
        description: current.description || '',
        icon: current.icon || '',
      },
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      console.error('OpenWeatherMap request timed out after ' + TIMEOUT_MS + 'ms');
      return res.status(504).json({ success: false, message: 'Weather service timed out. Please try again.' });
    }
    if (err && err.status) {
      console.error('OpenWeatherMap responded ' + err.status + ': ' + err.detail);
      const message = err.status === 401
        ? 'Weather service rejected the API key.'
        : 'Could not fetch weather right now. Please try again.';
      return res.status(502).json({ success: false, message: message });
    }
    console.error('Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  } finally {
    clearTimeout(timer);
  }
};
