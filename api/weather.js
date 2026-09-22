/* ==========================================================================
   GET /api/weather?city=<slug>
   --------------------------------------------------------------------------
   Server side proxy for the OpenWeatherMap Current Weather API. The API key
   lives only in process.env.OPENWEATHER_API_KEY and is never sent to the
   browser — the response below is a narrow projection, not the raw payload.

   Only the slugs in CITIES are accepted. That keeps this from becoming an
   open proxy that anyone could point at arbitrary coordinates using our key,
   and gives us the "invalid city" error path for free.
   ========================================================================== */

const OWM_URL = 'https://api.openweathermap.org/data/2.5/weather';
const TIMEOUT_MS = 6000;

/* Keep these slugs in sync with WM_DATA.cities in assets/js/data.js. */
const CITIES = {
  ludhiana:   { name: 'Ludhiana',   state: 'Punjab',            lat: 30.901,  lon: 75.8573 },
  amritsar:   { name: 'Amritsar',   state: 'Punjab',            lat: 31.634,  lon: 74.8723 },
  chandigarh: { name: 'Chandigarh', state: 'Chandigarh',        lat: 30.7333, lon: 76.7794 },
  delhi:      { name: 'Delhi',      state: 'Delhi',             lat: 28.6139, lon: 77.209 },
  mumbai:     { name: 'Mumbai',     state: 'Maharashtra',       lat: 19.076,  lon: 72.8777 },
  bengaluru:  { name: 'Bengaluru',  state: 'Karnataka',         lat: 12.9716, lon: 77.5946 },
  jaipur:     { name: 'Jaipur',     state: 'Rajasthan',         lat: 26.9124, lon: 75.7873 },
  shimla:     { name: 'Shimla',     state: 'Himachal Pradesh',  lat: 31.1048, lon: 77.1734 },
};

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

  const slug = typeof req.query.city === 'string' ? req.query.city.trim().toLowerCase() : '';
  const city = CITIES[slug];
  if (!city) {
    return res.status(400).json({ success: false, message: 'Unknown city. Pick one from the list.' });
  }

  const url = OWM_URL
    + '?lat=' + encodeURIComponent(city.lat)
    + '&lon=' + encodeURIComponent(city.lon)
    + '&units=metric'
    + '&appid=' + encodeURIComponent(apiKey);

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

  try {
    const upstream = await fetch(url, { signal: controller.signal });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(function () { return ''; });
      console.error('OpenWeatherMap responded ' + upstream.status + ': ' + detail);
      const message = upstream.status === 401
        ? 'Weather service rejected the API key.'
        : 'Could not fetch weather right now. Please try again.';
      return res.status(502).json({ success: false, message });
    }

    const owm = await upstream.json();
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
        slug: slug,
        city: city.name,
        state: city.state,
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
    console.error('Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  } finally {
    clearTimeout(timer);
  }
};
