/* ==========================================================================
   WEATHER MENU — app
   --------------------------------------------------------------------------
   Reads window.WM_DATA (assets/js/data.js), fetches the weather for the
   searched city from /api/weather, then renders the menu with the weather
   appropriate items first.

   Any city name can be typed — WM_DATA.suggestions only fills the
   autocomplete list and the quick pick chips. The city is resolved to
   coordinates server side, so no city list is maintained here.

   If the weather cannot be fetched for any reason the full menu still
   renders in its normal order — the product list never depends on the API.
   ========================================================================== */

(function () {
  'use strict';

  var D = window.WM_DATA;
  if (!D) return;

  var CUR = D.site.currencySymbol;
  var DEAL_PCT = D.site.dealPercent;
  var RAIN = ['Rain', 'Drizzle', 'Thunderstorm'];
  var CACHE_MS = 10 * 60 * 1000;
  var LAST_CITY_KEY = 'wm:lastCity';

  /* OpenWeatherMap condition -> emoji, so there is no icon asset to load. */
  var ICONS = {
    Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️',
    Snow: '❄️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️', Smoke: '🌫️', Dust: '🌪️',
    Sand: '🌪️', Squall: '🌬️', Tornado: '🌪️'
  };

  var el = {
    form: document.getElementById('cityForm'),
    input: document.getElementById('cityInput'),
    go: document.getElementById('cityGo'),
    list: document.getElementById('cityList'),
    chips: document.getElementById('cityChips'),
    card: document.getElementById('weatherCard'),
    icon: document.getElementById('wcIcon'),
    place: document.getElementById('wcCity'),
    temp: document.getElementById('wcTemp'),
    cond: document.getElementById('wcCond'),
    note: document.getElementById('wcNote'),
    retry: document.getElementById('wcRetry'),
    recSection: document.getElementById('recSection'),
    recTitle: document.getElementById('recTitle'),
    recDeal: document.getElementById('recDeal'),
    recGrid: document.getElementById('recGrid'),
    allTitle: document.getElementById('allTitle'),
    allGrid: document.getElementById('allGrid')
  };

  /* --------------------------------------------------------------- helpers */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function catName(slug) {
    for (var i = 0; i < D.categories.length; i++) {
      if (D.categories[i].slug === slug) return D.categories[i].name;
    }
    return slug;
  }

  function dealPrice(price) {
    return Math.round(price * (100 - DEAL_PCT) / 100);
  }

  /* ------------------------------------------------------ rules + ranking */

  function ruleByKey(key) {
    for (var i = 0; i < D.rules.length; i++) {
      if (D.rules[i].key === key) return D.rules[i];
    }
    return null;
  }

  /* Rain wins over temperature; otherwise the bands from the brief apply. */
  function pickRule(tempC, condition) {
    if (RAIN.indexOf(condition) !== -1) return ruleByKey('rainy');
    if (tempC >= 30) return ruleByKey('hot');
    if (tempC >= 24) return ruleByKey('warm');
    if (tempC >= 15) return ruleByKey('cool');
    return ruleByKey('cold');
  }

  /* Recommended = items whose category is named by the rule, ordered by how
     strong that category is. Everything else keeps its original order. */
  function rank(rule) {
    var recommended = [];
    var rest = [];

    D.products.forEach(function (p, i) {
      var score = rule.categories.indexOf(p.category);
      if (score === -1) rest.push(p);
      else recommended.push({ item: p, score: score, i: i });
    });

    recommended.sort(function (a, b) {
      return a.score - b.score || a.i - b.i;
    });

    return {
      recommended: recommended.map(function (r) { return r.item; }),
      rest: rest
    };
  }

  /* ---------------------------------------------------------- card markup */

  function cardHTML(item, opts) {
    opts = opts || {};
    var onDeal = opts.dealCategory === item.category;
    var price = onDeal
      ? '<span class="card__was">' + CUR + item.price + '</span>'
        + '<span class="card__now">' + CUR + dealPrice(item.price) + '</span>'
      : '<span class="card__now">' + CUR + item.price + '</span>';

    return ''
      + '<article class="card' + (item.inStock ? '' : ' card--out') + '" data-slug="' + esc(item.slug) + '">'
      +   '<div class="card__media">'
      +     '<span class="card__emoji" aria-hidden="true">' + item.emoji + '</span>'
      +     '<div class="card__tags">'
      +       (onDeal ? '<span class="card__deal">' + esc(String(DEAL_PCT)) + '% OFF</span>' : '')
      +       (item.badge ? '<span class="card__badge">' + esc(item.badge) + '</span>' : '')
      +     '</div>'
      +   '</div>'
      +   '<div class="card__body">'
      +     '<p class="card__cat">' + esc(catName(item.category)) + '</p>'
      +     '<h3 class="card__name">' + esc(item.name) + '</h3>'
      +     '<p class="card__sub">' + esc(item.subtitle) + '</p>'
      +     '<div class="card__foot">'
      +       '<p class="card__price">' + price + '</p>'
      +       '<span class="card__add" aria-hidden="true">+</span>'
      +     '</div>'
      +   '</div>'
      + '</article>';
  }

  function paint(grid, items, opts) {
    grid.innerHTML = items.map(function (p) { return cardHTML(p, opts); }).join('');
  }

  /* ------------------------------------------------------------- rendering */

  /* No weather (nothing searched yet, or the fetch failed): the whole menu. */
  function renderPlainMenu() {
    el.recSection.hidden = true;
    el.allTitle.textContent = 'All Products';
    paint(el.allGrid, D.products, {});
  }

  function renderForWeather(weather) {
    var rule = pickRule(weather.tempC, weather.condition);
    var split = rank(rule);

    el.recTitle.textContent = 'Recommended for this Weather';
    el.recDeal.textContent = rule.deal.text;
    el.recDeal.hidden = false;
    paint(el.recGrid, split.recommended, { dealCategory: rule.deal.category });
    el.recSection.hidden = split.recommended.length === 0;

    el.allTitle.textContent = 'All Products';
    paint(el.allGrid, split.rest, {});

    el.note.textContent = rule.note;
  }

  /* ---------------------------------------------------- weather card state */

  function setCardState(state) {
    el.card.classList.toggle('is-loading', state === 'loading');
    el.card.classList.toggle('is-error', state === 'error');
    el.retry.hidden = state !== 'error';
  }

  function showLoading(cityName) {
    setCardState('loading');
    el.icon.textContent = '⏳';
    el.place.textContent = cityName;
    el.temp.textContent = '—';
    el.cond.textContent = 'Fetching weather…';
    el.note.textContent = 'Fetching weather for ' + cityName + '…';
  }

  function showWeather(w) {
    setCardState('ok');
    el.icon.textContent = ICONS[w.condition] || '🌡️';
    el.place.textContent = w.state ? w.city + ', ' + w.state : w.city;
    el.temp.textContent = w.tempC + '°C';
    el.cond.textContent = w.description
      ? w.description.charAt(0).toUpperCase() + w.description.slice(1)
      : w.condition;
  }

  function showError(message) {
    setCardState('error');
    el.icon.textContent = '⚠️';
    el.temp.textContent = '—';
    el.cond.textContent = message;
    el.note.textContent = 'Showing the full menu in its normal order.';
  }

  function showPrompt() {
    setCardState('ok');
    el.icon.textContent = '📍';
    el.place.textContent = 'No city selected';
    el.temp.textContent = '—';
    el.cond.textContent = 'Search a city to see the weather';
    el.note.textContent = 'Enter a location above for weather based suggestions.';
  }

  /* ------------------------------------------------------------- data flow */

  /* Short lived cache so repeat searches are instant and we stay well inside
     the free API tier. Keyed on the normalised query. */
  function key(city) {
    return 'wm:weather:' + city.toLowerCase();
  }

  function cached(city) {
    try {
      var raw = sessionStorage.getItem(key(city));
      if (!raw) return null;
      var hit = JSON.parse(raw);
      if (Date.now() - hit.at > CACHE_MS) return null;
      return hit.data;
    } catch (e) { return null; }
  }

  function cache(city, data) {
    try {
      sessionStorage.setItem(key(city), JSON.stringify({ at: Date.now(), data: data }));
    } catch (e) { /* private mode / full quota — caching is optional */ }
  }

  function clean(raw) {
    return String(raw || '').replace(/\s+/g, ' ').trim();
  }

  function load(raw) {
    var city = clean(raw);

    if (!city) {
      showPrompt();
      renderPlainMenu();
      return;
    }
    if (city.length < 2) {
      showError('Enter at least two letters.');
      el.place.textContent = city;
      renderPlainMenu();
      return;
    }

    try { localStorage.setItem(LAST_CITY_KEY, city); } catch (e) { /* optional */ }

    var hit = cached(city);
    if (hit) {
      showWeather(hit);
      renderForWeather(hit);
      return;
    }

    showLoading(city);
    el.input.disabled = true;
    el.go.disabled = true;

    fetch('/api/weather?city=' + encodeURIComponent(city))
      .then(function (res) {
        /* A non-JSON body means the route is missing or a proxy got in the
           way — never show the raw parse error, it means nothing to anyone. */
        return res.text().then(function (text) {
          var body = null;
          try { body = JSON.parse(text); } catch (e) { /* handled below */ }
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (!r.body) {
          console.error('Weather route returned a non-JSON response (status ' + r.status + ')');
          throw new Error('Weather service is unavailable. Is the API route running?');
        }
        if (!r.ok || !r.body.success || !r.body.data) {
          throw new Error(r.body.message || 'Could not fetch weather right now.');
        }
        cache(city, r.body.data);
        showWeather(r.body.data);
        renderForWeather(r.body.data);
      })
      .catch(function (err) {
        console.error('Weather fetch failed:', err);
        el.place.textContent = city;
        showError(err && err.message ? err.message : 'Weather unavailable.');
        renderPlainMenu();
      })
      .finally(function () {
        el.input.disabled = false;
        el.go.disabled = false;
      });
  }

  /* ------------------------------------------------------------------ init */

  function populateSuggestions() {
    var names = D.suggestions || [];

    el.list.innerHTML = names.map(function (n) {
      return '<option value="' + esc(n) + '"></option>';
    }).join('');

    el.chips.innerHTML = names.slice(0, 6).map(function (n) {
      return '<button type="button" class="chip" data-city="' + esc(n) + '">' + esc(n) + '</button>';
    }).join('');

    el.chips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      el.input.value = chip.getAttribute('data-city');
      load(el.input.value);
    });
  }

  populateSuggestions();
  renderPlainMenu();

  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    load(el.input.value);
  });

  el.retry.addEventListener('click', function () { load(el.input.value); });

  var last = null;
  try { last = localStorage.getItem(LAST_CITY_KEY); } catch (e) { /* optional */ }

  if (last) {
    el.input.value = last;
    load(last);
  } else {
    showPrompt();
  }
})();
