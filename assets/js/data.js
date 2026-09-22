/* ==========================================================================
   WEATHER MENU — menu catalogue + weather rules
   --------------------------------------------------------------------------
   This is the single source of truth for the page. It is read by app.js
   (location selector, ranking, rendering).

   To add or change an item, edit the `products` array below. Every item's
   `category` must be one of the slugs declared in `categories`.

   Field notes
     slug        stable id, also used as the DOM key
     category    must match a `categories[].slug`
     price       number, in rupees
     emoji       stands in for a product image — no image assets needed
     badge       short label shown on the card. null for none
     inStock     false disables the Add button and dims the card

   Weather rules
     Each rule lists `categories` STRONGEST FIRST — that order drives both
     which items are recommended and how they are sorted. `deal` names the
     one category that gets the promotional badge. The discount is a display
     only business rule; the prices below are never modified.
   ========================================================================== */

window.WM_DATA = {
  "site": {
    "name": "Chaupal Cafe",
    "tagline": "Served to suit the sky",
    "currencySymbol": "₹",
    "dealPercent": 10
  },

  "cities": [
    { "slug": "ludhiana",   "name": "Ludhiana",   "state": "Punjab" },
    { "slug": "amritsar",   "name": "Amritsar",   "state": "Punjab" },
    { "slug": "chandigarh", "name": "Chandigarh", "state": "Chandigarh" },
    { "slug": "delhi",      "name": "Delhi",      "state": "Delhi" },
    { "slug": "mumbai",     "name": "Mumbai",     "state": "Maharashtra" },
    { "slug": "bengaluru",  "name": "Bengaluru",  "state": "Karnataka" },
    { "slug": "jaipur",     "name": "Jaipur",     "state": "Rajasthan" },
    { "slug": "shimla",     "name": "Shimla",     "state": "Himachal Pradesh" }
  ],

  "categories": [
    { "slug": "cold-drinks",  "name": "Cold Drinks" },
    { "slug": "juices",       "name": "Juices" },
    { "slug": "frozen",       "name": "Ice Cream & Shakes" },
    { "slug": "hot-drinks",   "name": "Tea & Coffee" },
    { "slug": "soups",        "name": "Soups" },
    { "slug": "noodles",      "name": "Noodles" },
    { "slug": "fried-snacks", "name": "Fried Snacks" },
    { "slug": "light-snacks", "name": "Light Snacks" }
  ],

  "products": [
    { "slug": "masala-soda",       "name": "Masala Soda",       "subtitle": "Jeera, lemon, chilled soda",      "category": "cold-drinks",  "price": 60,  "emoji": "🥤", "badge": "Best seller",  "inStock": true },
    { "slug": "nimbu-pani",        "name": "Nimbu Pani",        "subtitle": "Fresh lime, mint, rock salt",     "category": "cold-drinks",  "price": 50,  "emoji": "🍋", "badge": null,           "inStock": true },
    { "slug": "chilled-cola",      "name": "Chilled Cola",      "subtitle": "300 ml bottle, served over ice",  "category": "cold-drinks",  "price": 45,  "emoji": "🥫", "badge": null,           "inStock": true },

    { "slug": "orange-juice",      "name": "Orange Juice",      "subtitle": "Pressed to order, no sugar",      "category": "juices",       "price": 90,  "emoji": "🍊", "badge": null,           "inStock": true },
    { "slug": "sugarcane-juice",   "name": "Sugarcane Juice",   "subtitle": "Ganne ka ras with ginger",        "category": "juices",       "price": 70,  "emoji": "🌿", "badge": "Seasonal",     "inStock": true },
    { "slug": "mango-juice",       "name": "Mango Juice",       "subtitle": "Alphonso pulp, lightly chilled",  "category": "juices",       "price": 95,  "emoji": "🥭", "badge": null,           "inStock": true },

    { "slug": "vanilla-ice-cream", "name": "Vanilla Ice Cream", "subtitle": "Two scoops, roasted nuts",        "category": "frozen",       "price": 80,  "emoji": "🍨", "badge": null,           "inStock": true },
    { "slug": "cold-coffee",       "name": "Cold Coffee",       "subtitle": "Blended thick with ice cream",    "category": "frozen",       "price": 120, "emoji": "🧊", "badge": "Best seller",  "inStock": true },
    { "slug": "mango-shake",       "name": "Mango Shake",       "subtitle": "Thick shake, chilled glass",      "category": "frozen",       "price": 110, "emoji": "🥛", "badge": null,           "inStock": true },

    { "slug": "masala-chai",       "name": "Masala Chai",       "subtitle": "Elaichi, adrak, full cream milk", "category": "hot-drinks",   "price": 30,  "emoji": "☕", "badge": "Best seller",  "inStock": true },
    { "slug": "filter-coffee",     "name": "Filter Coffee",     "subtitle": "South Indian style, frothed",     "category": "hot-drinks",   "price": 55,  "emoji": "🫖", "badge": null,           "inStock": true },
    { "slug": "lemon-green-tea",   "name": "Lemon Green Tea",   "subtitle": "Light, served piping hot",        "category": "hot-drinks",   "price": 40,  "emoji": "🍵", "badge": null,           "inStock": true },

    { "slug": "tomato-soup",       "name": "Tomato Soup",       "subtitle": "Creamy, with butter croutons",    "category": "soups",        "price": 90,  "emoji": "🍲", "badge": null,           "inStock": true },
    { "slug": "sweet-corn-soup",   "name": "Sweet Corn Soup",   "subtitle": "Clear broth, sweet corn",         "category": "soups",        "price": 95,  "emoji": "🌽", "badge": null,           "inStock": true },

    { "slug": "veg-noodles",       "name": "Veg Hakka Noodles", "subtitle": "Wok tossed, spring onion",        "category": "noodles",      "price": 130, "emoji": "🍜", "badge": null,           "inStock": true },
    { "slug": "masala-maggi",      "name": "Masala Maggi",      "subtitle": "Two minute, made properly",       "category": "noodles",      "price": 60,  "emoji": "🍝", "badge": "Student pick", "inStock": true },

    { "slug": "onion-pakora",      "name": "Onion Pakora",      "subtitle": "Crisp besan, green chutney",      "category": "fried-snacks", "price": 70,  "emoji": "🧅", "badge": "Best seller",  "inStock": true },
    { "slug": "punjabi-samosa",    "name": "Punjabi Samosa",    "subtitle": "Aloo masala, imli chutney",       "category": "fried-snacks", "price": 25,  "emoji": "🥟", "badge": null,           "inStock": true },
    { "slug": "bread-pakora",      "name": "Bread Pakora",      "subtitle": "Stuffed, deep fried, hot",        "category": "fried-snacks", "price": 45,  "emoji": "🍞", "badge": null,           "inStock": true },

    { "slug": "grilled-sandwich",  "name": "Grilled Sandwich",  "subtitle": "Veg, cheese, tandoori mayo",      "category": "light-snacks", "price": 85,  "emoji": "🥪", "badge": null,           "inStock": true },
    { "slug": "bhel-puri",         "name": "Bhel Puri",         "subtitle": "Puffed rice, raw mango, sev",     "category": "light-snacks", "price": 55,  "emoji": "🥗", "badge": null,           "inStock": true },
    { "slug": "namkeen-plate",     "name": "Namkeen Plate",     "subtitle": "Bikaneri mixture, roasted",       "category": "light-snacks", "price": 35,  "emoji": "🥜", "badge": null,           "inStock": true }
  ],

  /* `rainy` is matched on the weather condition rather than temperature, so
     app.js tests it before the temperature bands. */
  "rules": [
    {
      "key": "rainy",
      "label": "Rainy weather",
      "note": "Rain outside — hot drinks and fried snacks first.",
      "categories": ["hot-drinks", "fried-snacks", "soups"],
      "deal": { "category": "fried-snacks", "text": "🌧️ Rainy Day Deal — 10% OFF Pakora" }
    },
    {
      "key": "hot",
      "label": "Hot weather",
      "note": "It is hot — cooling drinks and ice cream first.",
      "categories": ["cold-drinks", "frozen", "juices"],
      "deal": { "category": "cold-drinks", "text": "☀️ Hot Weather Deal — 10% OFF Cold Drinks" }
    },
    {
      "key": "warm",
      "label": "Warm weather",
      "note": "Pleasantly warm — chilled drinks and light bites.",
      "categories": ["cold-drinks", "juices", "light-snacks"],
      "deal": { "category": "juices", "text": "🌤️ Warm Day Deal — 10% OFF Juices" }
    },
    {
      "key": "cool",
      "label": "Cool weather",
      "note": "Cool out there — tea, snacks and noodles first.",
      "categories": ["hot-drinks", "light-snacks", "noodles", "soups"],
      "deal": { "category": "hot-drinks", "text": "🍵 Cool Evening Deal — 10% OFF Tea & Coffee" }
    },
    {
      "key": "cold",
      "label": "Cold weather",
      "note": "Cold weather — something hot to hold.",
      "categories": ["hot-drinks", "soups", "fried-snacks"],
      "deal": { "category": "soups", "text": "❄️ Cold Weather Deal — 10% OFF Soups" }
    }
  ]
};
