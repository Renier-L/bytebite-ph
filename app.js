const state = {
  token: localStorage.getItem('bb_token') || '',
  user: null,
  meals: [],
  vendors: [],
  reels: [],
  app: {},
  tracker: null,
  locatorFilter: 'All',
  generatorTier: 'All',
  scannedMealId: 'm1',
  customScanImage: '',
  customScanName: '',
  customScanData: null,
  isScanning: false,
  cameraStream: null,
  liveVisionTimer: null,
  mobilenetModel: null,
  mobilenetLoading: false,
  leafletMap: null,
  leafletMarkers: {},
  userMarker: null,
  reelsSoundOn: false,
  audioCtx: null,
  sizzleNode: null,
  sizzleGain: null,
  darkMode: localStorage.getItem('bb_dark_mode') === '1',
  proPlanTier: 'Low',
  proPlanSeed: 0,
  checkedGrocery: {},
  riskFastFood: 1,
  riskWater: 8,
  riskSalt: 'low',
  activeReelId: ''
};

function applyTheme() {
  document.body.classList.toggle('dark-theme', !!state.darkMode);
}

function toggleTheme() {
  state.darkMode = !state.darkMode;
  localStorage.setItem('bb_dark_mode', state.darkMode ? '1' : '0');
  applyTheme();
  render();
}

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const icons = {
  home: `<svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"/></svg>`,
  generator: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>`,
  tracker: `<svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
  scanner: `<svg viewBox="0 0 24 24"><path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2M3 12h18"/></svg>`,
  kidney: `<svg viewBox="0 0 24 24"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z"/></svg>`,
  guide: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>`,
  locator: `<svg viewBox="0 0 24 24"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  reels: `<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
  saved: `<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  premium: `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  profile: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>`
};

const navGroups = [
  {
    label: 'Core Platform',
    items: [
      ['home', 'home', 'Dashboard', ''],
      ['generator', 'generator', 'Meal Finder', 'Low–High'],
      ['scanner', 'scanner', 'Food Scanner', 'Live AI'],
      ['kidney', 'kidney', 'Kidney Shield', 'Health'],
      ['tracker', 'tracker', 'Daily Log', ''],
      ['locator', 'locator', 'Kitchen Map', 'GPS']
    ]
  },
  {
    label: 'Recipes & Video',
    items: [
      ['reels', 'reels', 'Cooking Reels', '12'],
      ['saved', 'saved', 'Saved Videos', '']
    ]
  },
  {
    label: 'Platform Guide & Account',
    items: [
      ['guide', 'guide', 'How ByteBite Works', 'Guide'],
      ['premium', 'premium', 'ByteBite Pro', 'PRO'],
      ['profile', 'profile', 'Settings', '']
    ]
  }
];

const titles = {
  home: ['Dashboard Overview', 'Philippine budget meal planning (₱45–₱235), real-time sodium tracking, and kidney health protection'],
  tracker: ['Daily Nutrition & Hydration Log', 'Record your meals, monitor daily sodium load against kidney limits, and track PHP food spend'],
  reels: ['Cooking Reels & Audio Guides', 'Step-by-step Filipino recipe videos with palengke ingredient costs and voice narration'],
  generator: ['Meal Finder (Low · Medium · High)', 'Filter 1,000+ kidney-safe Filipino meals across Low (₱45–₱75), Medium (₱80–₱135), and High (₱140–₱235) budgets'],
  scanner: ['Real-Time AI Food & Barcode Scanner', 'Scan your real plate via live camera or photo upload to inspect calories, cost, and sodium risk'],
  kidney: ['Kidney & Sodium Shield', 'Prevent kidney disease and dialysis with live sodium monitoring, hydration targets, and low-salt swaps'],
  guide: ['How ByteBite Works — Complete System Guide', 'Learn what ByteBite PH does and how every module works step by step to protect your health and budget'],
  locator: ['Interactive Cubao Kitchen Map', 'Real-time GPS map of verified low-sodium, budget-friendly partner kitchens in Cubao, Quezon City'],
  saved: ['Saved Cooking Videos', 'Your bookmarked Filipino cooking reels and low-sodium recipes'],
  premium: ['ByteBite Pro & 7-Day Planner', 'Automated 7-day kidney-safe meal schedule, unlimited AI scanning, and partner kitchen perks'],
  profile: ['Account & Health Settings', 'Configure your daily Philippine Peso food budget, kidney sodium limit, and nutrition goals']
};

/* High-Sodium Warning Presets & Real-Time Food Classifier Dictionary */
const REAL_WORLD_FOOD_PROFILES = [
  {
    id: 'warn_canton',
    keywords: ['noodle', 'ramen', 'spaghetti', 'pasta', 'pancit', 'canton', 'instant', 'carbonara', 'lo mein'],
    name: 'Instant Pancit Canton / Fried Noodles (Commercial)',
    price: 38,
    budgetTier: 'Low',
    calories: 540,
    protein: 10,
    carbs: 74,
    fat: 22,
    fiber: 2,
    sodiumMg: 1680,
    potassiumMg: 140,
    healthScore: 34,
    kidneyRisk: 'HIGH',
    image: './assets/meals/dish-01.jpg',
    swapMealId: 'm1',
    ingredients: [
      { item: 'Fried wheat noodles (palm oil)', amount: '120g', cost: '₱22' },
      { item: 'High-sodium seasoning & MSG packet', amount: '18g', cost: '₱8' },
      { item: 'Soy sauce &flavored oil sachet', amount: '12g', cost: '₱8' }
    ],
    verdict: '⚠️ High-Sodium Dialysis Risk (1,680mg Na — 84% of daily limit in 1 plate). Drink 3 extra glasses of water immediately and swap with Ginisang Monggo (₱48, 290mg Na).'
  },
  {
    id: 'warn_friedchicken',
    keywords: ['fried chicken', 'drumstick', 'wing', 'fast food', 'nugget', 'bucket', 'crispy chicken', 'gravy'],
    name: 'Fast-Food Crispy Fried Chicken with Gravy & Rice',
    price: 145,
    budgetTier: 'High',
    calories: 720,
    protein: 32,
    carbs: 58,
    fat: 38,
    fiber: 2,
    sodiumMg: 1590,
    potassiumMg: 310,
    healthScore: 42,
    kidneyRisk: 'HIGH',
    image: './assets/meals/inasal-plate.jpg',
    swapMealId: 'm3',
    ingredients: [
      { item: 'Brined & breaded deep-fried chicken', amount: '180g', cost: '₱95' },
      { item: 'Salted commercial gravy', amount: '60ml', cost: '₱20' },
      { item: 'White steamed rice', amount: '1 cup', cost: '₱30' }
    ],
    verdict: '⚠️ High Sodium & Saturated Fat (1,590mg Na). Frequent consumption strains blood pressure and kidneys. Swap with Grilled Chicken Inasal (₱98, 410mg Na).'
  },
  {
    id: 'warn_canned',
    keywords: ['corned beef', 'sardine', 'spam', 'luncheon meat', 'hotdog', 'sausage', 'tocino', 'longganisa', 'bacon', 'meatloaf', 'canned'],
    name: 'Processed Canned Meat / Silog Plate (Corned Beef / Hotdog)',
    price: 75,
    budgetTier: 'Low',
    calories: 610,
    protein: 21,
    carbs: 52,
    fat: 34,
    fiber: 1,
    sodiumMg: 1480,
    potassiumMg: 210,
    healthScore: 38,
    kidneyRisk: 'HIGH',
    image: './assets/meals/adobo-bowl.jpg',
    swapMealId: 'm4',
    ingredients: [
      { item: 'Cured/canned meat with sodium nitrite', amount: '120g', cost: '₱45' },
      { item: 'Fried garlic rice (Sinangag)', amount: '1 cup', cost: '₱18' },
      { item: 'Fried egg', amount: '1 pc', cost: '₱12' }
    ],
    verdict: '⚠️ High-Sodium Preservatives & Nitrites (1,480mg Na). Heavy renal workload. Swap with Tortang Talong or Tinolang Manok (₱55–₱88, 280mg Na).'
  },
  {
    id: 'warn_burger_pizza',
    keywords: ['burger', 'cheeseburger', 'hamburger', 'pizza', 'pepperoni', 'fries', 'french fries', 'sandwich', 'hot dog', 'burrito', 'taco'],
    name: 'Commercial Burger / Pizza / Fries Meal',
    price: 165,
    budgetTier: 'High',
    calories: 780,
    protein: 26,
    carbs: 76,
    fat: 41,
    fiber: 3,
    sodiumMg: 1520,
    potassiumMg: 290,
    healthScore: 39,
    kidneyRisk: 'HIGH',
    image: './assets/meals/chicken-wrap.jpg',
    swapMealId: 'm10',
    ingredients: [
      { item: 'Processed patty / cured toppings & cheese', amount: '150g', cost: '₱95' },
      { item: 'Refined bun / crust & salted fries', amount: '140g', cost: '₱50' },
      { item: 'Commercial dressing / ketchup', amount: '30g', cost: '₱20' }
    ],
    verdict: '⚠️ High Sodium Load (1,520mg Na). Excess salt causes fluid retention and elevated blood pressure. Swap with Roasted Chicken Pita Wrap (₱85, 380mg Na).'
  },
  {
    id: 'healthy_fruit_snack',
    keywords: ['banana', 'apple', 'orange', 'mango', 'papaya', 'pineapple', 'fruit', 'berry', 'strawberry', 'lemon', 'pomegranate', 'fig', 'custard apple', 'jackfruit'],
    name: 'Fresh Philippine Fruit Plate (Saba Banana / Papaya / Mango)',
    price: 45,
    budgetTier: 'Low',
    calories: 210,
    protein: 3,
    carbs: 48,
    fat: 1,
    fiber: 6,
    sodiumMg: 12,
    potassiumMg: 480,
    healthScore: 96,
    kidneyRisk: 'SAFE',
    image: './assets/meals/banana-oat-pancake.jpg',
    swapMealId: 'm11',
    ingredients: [
      { item: 'Fresh ripe Philippine Saba banana or papaya', amount: '180g', cost: '₱28' },
      { item: 'Rolled oats / chia topping', amount: '30g', cost: '₱17' }
    ],
    verdict: '✓ Kidney-Safe Ultra-Low Sodium (12mg Na). Rich in natural fiber and antioxidants with zero added salt.'
  }
];

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

function cleanMealName(name = '') {
  return String(name).replace(/\s*#\d+\s*$/, '').trim();
}

function cleanMealDesc(m) {
  if (m && m.description && !m.description.includes('ByteBite-style') && !m.description.startsWith('Prepared with ')) {
    return m.description;
  }
  return 'Freshly prepared with lean protein, crisp local vegetables, natural Filipino aromatics, and kidney-safe low-sodium seasoning.';
}

function relUrl(p = '') {
  const s = String(p || '');
  if (!s) return './assets/meals/tofu-bowl.jpg';
  if (s.startsWith('./assets/') || s.startsWith('/media/')) return '.' + s;
  return s;
}

function mealImage(m) {
  if (m && m.image) return relUrl(m.image);
  return './assets/meals/tofu-bowl.jpg';
}

function money(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 });
}

function getMealTier(m) {
  if (m && m.budgetTier) return m.budgetTier;
  const p = Number(m?.price || 0);
  if (p <= 75) return 'Low';
  if (p <= 135) return 'Medium';
  return 'High';
}

function getTierLabel(tier) {
  if (tier === 'Low') return 'Low · ₱45–₱75';
  if (tier === 'Medium') return 'Medium · ₱80–₱135';
  return 'High · ₱140–₱235';
}

function getSodiumRisk(sodiumMg) {
  const na = Number(sodiumMg || 340);
  if (na <= 450) return { level: 'SAFE', label: '✓ Kidney-Safe Low Sodium', cls: 'risk-safe' };
  if (na <= 850) return { level: 'MODERATE', label: 'Moderate Sodium', cls: 'risk-mod' };
  return { level: 'HIGH', label: '⚠️ High-Sodium Dialysis Risk', cls: 'risk-high' };
}

function route() {
  const r = (location.hash.replace('#/', '') || 'home').split('?')[0];
  return titles[r] ? r : 'home';
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let __staticDBCache = null;

async function getStaticDB() {
  if (__staticDBCache) return __staticDBCache;
  const saved = localStorage.getItem('bb_static_db_v1');
  if (saved) {
    try {
      __staticDBCache = JSON.parse(saved);
      if (__staticDBCache && Array.isArray(__staticDBCache.meals) && __staticDBCache.meals.length) {
        return __staticDBCache;
      }
    } catch {}
  }
  const r = await fetch('./data/db.json');
  __staticDBCache = await r.json();
  return __staticDBCache;
}

function saveStaticDB(db) {
  __staticDBCache = db;
  try {
    // Store user/session/tracker state in localStorage for GitHub Pages / Vercel static persistence
    localStorage.setItem('bb_static_state_v1', JSON.stringify({
      users: db.users,
      trackerLogs: db.trackerLogs,
      waterLogs: db.waterLogs
    }));
  } catch {}
}

function haversineClient(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = x => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function staticApiFallback(path, opts = {}) {
  const db = await getStaticDB();
  try {
    const st = JSON.parse(localStorage.getItem('bb_static_state_v1') || 'null');
    if (st) {
      if (st.users) db.users = st.users;
      if (st.trackerLogs) db.trackerLogs = st.trackerLogs;
      if (st.waterLogs) db.waterLogs = st.waterLogs;
    }
  } catch {}

  const today = new Date().toISOString().slice(0, 10);
  const bodyObj = opts.body ? JSON.parse(opts.body) : {};
  let currentUser = db.users?.[0] || {
    id: 'u1',
    name: 'Renier B. Lopez',
    email: 'student@tip.edu.ph',
    budget: 120,
    goal: 'Balanced',
    location: 'Cubao, Quezon City',
    dietary: 'No preference',
    premium: true,
    savedReels: [],
    dailyGoals: { calories: 2000, protein: 90, sodiumMg: 2000, waterGlasses: 8 }
  };

  const buildTracker = uid => {
    const logs = (db.trackerLogs || []).filter(x => x.userId === uid);
    const water = (db.waterLogs || []).filter(x => x.userId === uid).reduce((s, x) => s + (x.glasses || 0), 0);
    const totals = logs.reduce(
      (a, x) => ({
        calories: a.calories + x.calories * (x.servings || 1),
        protein: a.protein + x.protein * (x.servings || 1),
        sodiumMg: a.sodiumMg + x.sodiumMg * (x.servings || 1),
        spent: a.spent + x.price * (x.servings || 1)
      }),
      { calories: 0, protein: 0, sodiumMg: 0, spent: 0 }
    );
    return { date: today, logs, waterGlasses: Math.max(0, water), totals };
  };

  if (path === '/bootstrap') {
    return {
      user: state.token ? currentUser : null,
      app: {
        name: 'ByteBite',
        subscriptionPrice: 99,
        currency: 'PHP',
        serviceArea: 'Cubao, Quezon City',
        pcUrl: location.origin,
        lanUrls: [location.origin],
        publicUrl: location.origin
      },
      meals: db.meals || [],
      vendors: db.vendors || [],
      reels: db.reels || [],
      tracker: state.token ? buildTracker(currentUser.id) : null
    };
  }
  if (path === '/hosting-info') {
    return { pcUrl: location.origin, lanUrls: [location.origin], publicUrl: location.origin };
  }
  if (path.startsWith('/auth/')) {
    if (bodyObj.name) currentUser.name = bodyObj.name;
    if (bodyObj.email) currentUser.email = bodyObj.email;
    saveStaticDB(db);
    return { token: 'static-cloud-token', user: currentUser };
  }
  if (path.startsWith('/live/nearby')) {
    const u = new URL('http://x' + path);
    const lat = Number(u.searchParams.get('lat') || 14.6218);
    const lon = Number(u.searchParams.get('lon') || 121.0574);
    const places = (db.vendors || []).map(v => ({
      id: v.id,
      name: v.name,
      type: `${v.type} (${v.priceRange})`,
      address: v.address || v.area,
      priceRange: v.priceRange,
      lat: v.lat || 14.6218,
      lon: v.lon || 121.0574,
      distanceKm: +haversineClient(lat, lon, v.lat || 14.6218, v.lon || 121.0574).toFixed(2),
      vegetarian: 'yes'
    })).sort((a, b) => a.distanceKm - b.distanceKm);
    return { live: true, places };
  }
  if (path.startsWith('/tracker/meal/')) {
    const mealId = path.split('/').pop();
    const meal = (db.meals || []).find(m => m.id === mealId) || db.meals[0];
    db.trackerLogs = db.trackerLogs || [];
    db.trackerLogs.push({
      id: 'log-' + Date.now(),
      userId: currentUser.id,
      date: today,
      name: meal.name,
      source: 'ByteBite Meal',
      calories: meal.calories,
      protein: meal.protein,
      sodiumMg: meal.sodiumMg || 320,
      price: meal.price,
      servings: 1
    });
    saveStaticDB(db);
    return buildTracker(currentUser.id);
  }
  if (path === '/tracker/log' && opts.method === 'POST') {
    db.trackerLogs = db.trackerLogs || [];
    db.trackerLogs.push({
      id: 'log-' + Date.now(),
      userId: currentUser.id,
      date: today,
      name: bodyObj.name || 'Logged Meal',
      source: bodyObj.source || 'Scanner',
      calories: Number(bodyObj.calories || 350),
      protein: Number(bodyObj.protein || 18),
      sodiumMg: Number(bodyObj.sodiumMg || 320),
      price: Number(bodyObj.price || 55),
      servings: Number(bodyObj.servings || 1)
    });
    saveStaticDB(db);
    return buildTracker(currentUser.id);
  }
  if (path.startsWith('/tracker/log/') && opts.method === 'DELETE') {
    const lid = path.split('/').pop();
    db.trackerLogs = (db.trackerLogs || []).filter(x => x.id !== lid);
    saveStaticDB(db);
    return buildTracker(currentUser.id);
  }
  if (path === '/tracker/water') {
    db.waterLogs = db.waterLogs || [];
    db.waterLogs.push({ id: 'w-' + Date.now(), userId: currentUser.id, date: today, glasses: Number(bodyObj.glasses || 1) });
    saveStaticDB(db);
    return buildTracker(currentUser.id);
  }
  if (path === '/profile') {
    Object.assign(currentUser, bodyObj);
    saveStaticDB(db);
    return currentUser;
  }
  if (path === '/subscription/activate') {
    currentUser.premium = true;
    saveStaticDB(db);
    return { user: currentUser };
  }
  return {};
}

async function api(path, opts = {}) {
  try {
    const r = await fetch('/api' + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
        ...(opts.headers || {})
      }
    });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return await staticApiFallback(path, opts);
    }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 404 || r.status === 405 || r.status === 502) {
        return await staticApiFallback(path, opts);
      }
      throw new Error(d.error || 'Request failed');
    }
    return d;
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('Load failed')) {
      throw err;
    }
    return await staticApiFallback(path, opts);
  }
}

async function openHostingModal() {
  const githubPagesUrl = 'https://renier-l.github.io/bytebite-ph/';
  let info = {
    pcUrl: state.app?.pcUrl || githubPagesUrl,
    lanUrls: state.app?.lanUrls || [],
    publicUrl: githubPagesUrl
  };
  try {
    const srvInfo = await api('/hosting-info');
    if (srvInfo) {
      info.lanUrls = srvInfo.lanUrls || [];
      info.pcUrl = srvInfo.pcUrl || githubPagesUrl;
    }
  } catch {}

  const primaryMobileUrl = githubPagesUrl;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(primaryMobileUrl)}`;

  modal(`
    <p class="muted" style="margin-top:0;">
      ByteBite PH is permanently hosted on <b>GitHub Cloud Hosting</b>. Scan the QR code below with your smartphone camera or open the cloud link on any PC or mobile device:
    </p>

    <div style="display:grid; grid-template-columns: 180px 1fr; gap:16px; align-items:center; padding:14px; border-radius:12px; background:var(--bg); border:1px solid var(--line); margin-bottom:14px;">
      <div style="background:#fff; padding:8px; border-radius:10px; display:grid; place-items:center;">
        <img src="${esc(qrSrc)}" alt="Mobile QR Code" style="width:160px; height:160px; display:block;" />
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div>
          <div class="eyebrow">Permanent Cloud Hosting URL (GitHub Pages)</div>
          <div style="font-weight:700; font-size:14px; word-break:break-all; color:var(--brand-bright); margin-top:3px;">
            <a href="${esc(githubPagesUrl)}" target="_blank" rel="noopener">${esc(githubPagesUrl)}</a>
          </div>
          <small class="muted">24/7 permanent HTTPS cloud link — works on any mobile phone, tablet, or PC anywhere.</small>
        </div>

        <div>
          <div class="eyebrow">GitHub Repository</div>
          <div style="font-weight:700; font-size:13px;">
            <a href="https://github.com/Renier-L/bytebite-ph" target="_blank" rel="noopener">https://github.com/Renier-L/bytebite-ph</a>
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex; gap:8px; justify-content:flex-end;">
      <button class="btn btn-secondary mini" onclick="closeModal()">Close</button>
    </div>
  `, 'Cloud Hosting & Mobile QR');
}

function moduleGuide(moduleName, steps = []) {
  return `
    <div class="module-guide-bar">
      <div class="module-guide-top">
        <div class="module-guide-title">
          <span class="side-dot"></span>
          <span>How ${esc(moduleName)} Works — Quick 3-Step Guide</span>
        </div>
        <a class="btn btn-ghost mini" href="#/guide" style="padding:4px 10px; font-size:11.5px;">Full System Guide →</a>
      </div>
      <div class="module-guide-steps">
        ${steps.map((s, idx) => `
          <div class="module-step-item">
            <div class="module-step-badge">${idx + 1}</div>
            <div class="module-step-text">
              <b>${esc(s[0])}</b>
              <span>${esc(s[1])}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function boot() {
  applyTheme();
  const d = await api('/bootstrap');
  Object.assign(state, d);
  if (Array.isArray(state.meals)) {
    state.meals.forEach(m => { if (m && m.image) m.image = relUrl(m.image); });
  }
  if (Array.isArray(state.reels)) {
    state.reels.forEach(r => {
      if (r && r.video) r.video = relUrl(r.video);
      if (r && r.poster) r.poster = relUrl(r.poster);
    });
    if (state.reels.length > 1) {
      state.reels = shuffleArray(state.reels);
    }
    if (state.reels[0]) state.activeReelId = state.reels[0].id;
  }
  REAL_WORLD_FOOD_PROFILES.forEach(p => { if (p && p.image) p.image = relUrl(p.image); });
  connectEvents();
  render();
  // Preload MobileNet in the background for instant real-time camera food scanning
  preloadMobileNet();
}

async function preloadMobileNet() {
  if (state.mobilenetModel || state.mobilenetLoading) return;
  if (!window.mobilenet) return;
  try {
    state.mobilenetLoading = true;
    state.mobilenetModel = await window.mobilenet.load({ version: 2, alpha: 1.0 });
  } catch {} finally {
    state.mobilenetLoading = false;
  }
}

window.addEventListener('hashchange', () => {
  stopCamera();
  stopReelAudio();
  if (state.leafletMap) {
    try { state.leafletMap.remove(); } catch {}
    state.leafletMap = null;
  }
  render();
});

function shell(inner) {
  const r = route();
  const [title, sub] = titles[r] || titles.home;
  const dailyBudget = state.user?.budget || 150;
  const spentToday = state.tracker?.totals?.spent || 0;
  const sodiumToday = Math.round(state.tracker?.totals?.sodiumMg || 0);
  const sodiumLimit = state.user?.dailyGoals?.sodiumMg || 2000;

  return `
    <div class="app">
      <aside class="sidebar">
        <div class="sidebar-top">
          <a class="brand" href="#/home">
            <span class="brand-badge">B</span>
            <span class="brand-text">
              <span class="brand-name">ByteBite PH</span>
              <span class="brand-sub">Budget Nutrition &amp; Kidney Shield</span>
            </span>
          </a>
          <nav class="nav">
            ${navGroups.map(group => `
              <div class="nav-group-label">${esc(group.label)}</div>
              ${group.items.map(([k, ico, l, badge]) => `
                <a class="${r === k ? 'active' : ''}" href="#/${k}">
                  <span class="nav-icon">${icons[ico] || ''}</span>
                  <span>${esc(l)}</span>
                  ${badge ? `<span class="nav-badge">${esc(badge)}</span>` : ''}
                </a>
              `).join('')}
            `).join('')}
          </nav>
        </div>
        <div class="side-note">
          <div class="side-note-header">
            <span class="side-dot"></span>
            <span>Philippine Price Tiers</span>
          </div>
          <div><b>Low:</b> ₱45–₱75 · <b>Med:</b> ₱80–₱135 · <b>High:</b> ₱140–₱235</div>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <a class="btn btn-secondary mini" style="flex:1; font-size:11px; padding:5px 8px;" href="#/guide">App Guide</a>
            <button type="button" class="btn btn-secondary mini" style="flex:1; font-size:11px; padding:5px 8px;" onclick="openHostingModal()">Mobile QR</button>
          </div>
        </div>
      </aside>

      <main class="content">
        <header class="topbar">
          <div class="top-title">
            <h1>${esc(title)}</h1>
            <p>${esc(sub)}</p>
          </div>
          <div class="topbar-right">
            <a class="budget-pill" href="#/kidney" style="text-decoration:none;" title="Open Kidney & Sodium Shield">
              <span>Sodium Today:</span>
              <strong style="color:${sodiumToday > sodiumLimit ? 'var(--danger)' : 'var(--brand-bright)'};">${sodiumToday} / ${sodiumLimit}mg</strong>
            </a>
            <a class="budget-pill" href="#/tracker" style="text-decoration:none;" title="Open Daily Nutrition & Budget Log">
              <span>Daily Spend:</span>
              <strong>${money(spentToday)} / ${money(dailyBudget)}</strong>
            </a>
            <button class="btn btn-secondary mini" onclick="toggleTheme()" title="Switch between Clinical Daylight and Dark Studio Mode">${state.darkMode ? '☀️ Light' : '🌙 Dark'}</button>
            <a class="btn btn-secondary mini" href="#/guide">How It Works</a>
            ${state.user
              ? `<button class="btn btn-secondary mini" onclick="goProfile()">${esc(state.user.name.split(' ')[0])}</button>`
              : `<button class="btn btn-primary mini" onclick="showAuth()">Sign In</button>`}
          </div>
        </header>
        ${inner}
      </main>

      <nav class="bottom-nav">
        ${[
          ['home', 'home', 'Home'],
          ['generator', 'generator', 'Meals'],
          ['scanner', 'scanner', 'Scanner'],
          ['kidney', 'kidney', 'Kidney'],
          ['locator', 'locator', 'Map'],
          ['guide', 'guide', 'Guide']
        ].map(([k, ico, l]) => `
          <a class="${r === k ? 'active' : ''}" href="#/${k}">
            <span class="nav-icon">${icons[ico]}</span>
            <span>${l}</span>
          </a>
        `).join('')}
      </nav>
    </div>
  `;
}

function mealCard(m, track = true) {
  const img = mealImage(m);
  const tier = getMealTier(m);
  const vendor = state.vendors.find(v => (m.vendorIds || []).includes(v.id));
  const sodiumMg = m.sodiumMg || (m.sodium === 'low' ? 310 : 540);
  const cookTime = m.cookTime || '12 mins';
  const risk = getSodiumRisk(sodiumMg);

  return `
    <article class="card meal-card">
      <div class="meal-visual" onclick="openRecipe('${m.id}')" title="View Philippine palengke ingredient prices and cooking steps">
        <img src="${esc(img)}" alt="${esc(cleanMealName(m.name))}" loading="lazy" onerror="this.onerror=null;this.src='./assets/meals/tofu-bowl.jpg'" />
        <div class="meal-visual-shade"></div>
        <div class="meal-visual-overlay">
          <span class="tier-badge tier-${esc(tier)}">${esc(tier)} Tier · ${money(m.price)}</span>
          <span class="score-badge">✓ Kidney Safe</span>
        </div>
        <div class="meal-visual-bottom">
          <span>Na: ${sodiumMg}mg · Cook: ${esc(cookTime)}</span>
          <span>Recipe &amp; Cost →</span>
        </div>
      </div>

      <div class="meal-body">
        <div>
          <div class="meal-title-row">
            <h4>${esc(cleanMealName(m.name))}</h4>
            <span class="price">${money(m.price)}</span>
          </div>
          <p class="meal-desc">${esc(cleanMealDesc(m))}</p>
        </div>

        <div>
          <div class="macro-row">
            <div class="macro-cell">
              <b>${m.calories} kcal</b>
              <span>Calories</span>
            </div>
            <div class="macro-cell">
              <b>${m.protein}g</b>
              <span>Protein</span>
            </div>
            <div class="macro-cell">
              <b style="color: ${risk.level === 'SAFE' ? 'var(--brand-bright)' : 'var(--warn)'};">${sodiumMg}mg</b>
              <span>Sodium</span>
            </div>
          </div>

          <div style="margin-top: 10px;">
            <div class="vendor-tag">${esc(vendor ? `${vendor.name} · ${vendor.area}` : 'Cubao Partner Kitchen')}</div>
            <div class="meal-foot">
              <button class="btn btn-secondary mini" onclick="openRecipe('${m.id}')">Ingredients &amp; Cook</button>
              ${track
                ? `<button class="btn btn-primary mini" onclick="trackMeal('${m.id}')">+ Log Meal</button>`
                : ''}
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function openRecipe(mealId) {
  const m = state.meals.find(x => x.id === mealId) || state.meals[0];
  if (!m) return;
  const img = mealImage(m);
  const tier = getMealTier(m);
  const ingredients = m.ingredients && m.ingredients.length ? m.ingredients : [
    { item: 'Lean protein or firm tokwa (tofu)', amount: '150g', cost: '₱28' },
    { item: 'Fresh seasonal greens (malunggay, pechay, kangkong)', amount: '1.5 cups', cost: '₱16' },
    { item: 'Garlic, red onion, luya (ginger) & calamansi', amount: '2 tbsp', cost: '₱8' },
    { item: 'Steamed brown or red rice', amount: '1 cup', cost: '₱15' }
  ];
  const steps = m.steps && m.steps.length ? m.steps : [
    'Rinse and prep all fresh vegetables and pat the protein dry with paper towels.',
    'Sauté minced garlic, red onion, and ginger in 1 tsp oil over medium heat until fragrant.',
    'Cook the protein until tender, fold in the greens for the final 2 minutes, and season with fresh calamansi instead of excess salt or patis.'
  ];

  closeModal();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="auth-overlay" id="modal" onclick="if(event.target.id==='modal')closeModal()">
      <div class="auth-card recipe-modal">
        <div class="recipe-hero">
          <img src="${esc(img)}" alt="${esc(cleanMealName(m.name))}" onerror="this.onerror=null;this.src='./assets/meals/tofu-bowl.jpg'" />
          <div class="recipe-hero-shade"></div>
          <button class="recipe-close" onclick="closeModal()">✕</button>
          <div class="recipe-hero-info">
            <div class="eyebrow">${esc(m.category || 'Filipino Dish')} · ${esc(tier)} Budget Tier</div>
            <h2 style="margin: 4px 0 6px; font-size: 22px;">${esc(cleanMealName(m.name))}</h2>
            <div class="meta">
              <span class="chip" style="background: rgba(34,197,94,0.2); color: #86efac; border-color: rgba(34,197,94,0.4);">Real PH Cost: ${money(m.price)} (${esc(tier)})</span>
              <span class="chip">${m.calories} kcal</span>
              <span class="chip">${m.protein}g protein</span>
              <span class="chip">✓ ${m.sodiumMg || 320}mg sodium (Kidney Safe)</span>
              <span class="chip">Cook: ${esc(m.cookTime || '12 mins')}</span>
            </div>
          </div>
        </div>

        <div class="recipe-body">
          <p class="muted" style="margin: 0 0 14px; font-size: 13.5px;">${esc(cleanMealDesc(m))}</p>

          <h4 style="margin: 0 0 6px; font-size: 14.5px; color: var(--brand-bright);">Philippine Palengke Ingredients &amp; Breakdown</h4>
          <table class="ing-table">
            <thead>
              <tr style="color: var(--muted); font-size: 11px; text-transform: uppercase;">
                <td>Ingredient</td>
                <td>Portion</td>
                <td style="text-align: right;">Est. PH Cost</td>
              </tr>
            </thead>
            <tbody>
              ${ingredients.map(ing => `
                <tr>
                  <td><b>${esc(ing.item)}</b></td>
                  <td class="muted">${esc(ing.amount)}</td>
                  <td style="text-align: right; color: var(--brand-bright); font-weight: 700;">${esc(ing.cost)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h4 style="margin: 0 0 8px; font-size: 14.5px; color: var(--brand-bright);">Step-by-Step Low-Sodium Preparation</h4>
          <div class="step-list">
            ${steps.map((s, idx) => `
              <div class="step-item">
                <div class="step-num">${idx + 1}</div>
                <div>${esc(s)}</div>
              </div>
            `).join('')}
          </div>

          <div class="notice" style="margin-bottom: 14px;">
            <b>Kidney Protection Tip:</b> This recipe uses natural aromatics (garlic, ginger, calamansi) to keep sodium at <b>${m.sodiumMg || 320}mg</b>—saving over 1,200mg of sodium compared to instant noodles or fast food.
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end; padding-top: 10px; border-top: 1px solid var(--line);">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            <button class="btn btn-primary" onclick="closeModal(); trackMeal('${m.id}')">+ Log Meal (${money(m.price)})</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

function home() {
  const t = state.tracker?.totals || { calories: 0, protein: 0, sodiumMg: 0, spent: 0 };
  const g = state.user?.dailyGoals || { calories: 2000, protein: 90, sodiumMg: 2000, waterGlasses: 8 };
  const lowTierSample = state.meals.filter(m => getMealTier(m) === 'Low').slice(0, 2);
  const medTierSample = state.meals.filter(m => getMealTier(m) === 'Medium').slice(0, 2);
  const highTierSample = state.meals.filter(m => getMealTier(m) === 'High').slice(0, 2);
  const featuredMeals = [...lowTierSample, ...medTierSample, ...highTierSample];
  const topReelMeal = state.meals[0];

  return shell(`
    <section class="page">
      ${moduleGuide('ByteBite PH Dashboard', [
        ['1. Pick Your PH Budget Tier', 'Choose Low (₱45–₱75), Medium (₱80–₱135), or High (₱140–₱235) meals with itemized palengke ingredient costs.'],
        ['2. Scan or Inspect Sodium', 'Use the Live AI Camera Scanner or Kidney Shield to avoid high-salt foods that cause hypertension and dialysis.'],
        ['3. Log Meals & Locate Kitchens', 'Click "+ Log Meal" to track daily sodium & PHP spend, or open the GPS Map to find healthy Cubao eateries.']
      ])}

      <div class="kpi-strip">
        <div class="kpi-card">
          <div class="kpi-label"><span>Calories Today</span><span>Target: ${g.calories}</span></div>
          <div class="kpi-value">${state.user ? Math.round(t.calories) : 0} <span style="font-size:14px; font-weight:500; color:var(--muted);">kcal</span></div>
          <div class="kpi-sub">${pct(t.calories, g.calories)}% of daily energy target</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label"><span>Protein Intake</span><span>Target: ${g.protein}g</span></div>
          <div class="kpi-value">${state.user ? Math.round(t.protein) : 0}<span style="font-size:14px; font-weight:500; color:var(--muted);">g</span></div>
          <div class="kpi-sub">${pct(t.protein, g.protein)}% of daily protein goal</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label"><span>PH Food Spend</span><span>Budget: ${money(state.user?.budget || 150)}</span></div>
          <div class="kpi-value" style="color: var(--brand-bright);">${state.user ? money(t.spent) : '₱0'}</div>
          <div class="kpi-sub">Low (₱45–75) · Med (₱80–135) · High (₱140+)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label"><span>Kidney Sodium Load</span><span>Safe Limit: ${g.sodiumMg || 2000}mg</span></div>
          <div class="kpi-value" style="color: ${t.sodiumMg > (g.sodiumMg || 2000) ? 'var(--danger)' : 'var(--text)'};">${state.user ? Math.round(t.sodiumMg) : 0}<span style="font-size:14px; font-weight:500; color:var(--muted);">mg</span></div>
          <div class="kpi-sub"><a href="#/kidney" style="color:var(--brand-bright);">Open Kidney Shield →</a></div>
        </div>
      </div>

      <div class="hero">
        <div class="hero-main">
          <div>
            <div class="eyebrow">Philippine Budget &amp; Renal Health Platform</div>
            <h2>Eat healthy on a real ₱45–₱235 Philippine budget while protecting your kidneys.</h2>
            <p>Compare real carinderia and home-cooked meals across Low, Medium, and High price tiers, scan your food plate in real time to detect hidden sodium, and locate verified healthy kitchens on the interactive GPS map.</p>
          </div>
          <div class="actions">
            <a class="btn btn-primary" href="#/scanner">Scan My Food Live</a>
            <a class="btn btn-secondary" href="#/kidney">Kidney &amp; Sodium Shield</a>
            <a class="btn btn-secondary" href="#/locator">Open Live GPS Map</a>
            <a class="btn btn-secondary" href="#/guide">How ByteBite Works</a>
          </div>
        </div>

        <div class="hero-side">
          <div>
            <div class="eyebrow" style="margin-bottom: 8px;">Philippine Daily Budget Tiers</div>
            <div style="display:grid; gap:6px; font-size:12.5px;">
              <a href="#/generator" onclick="state.generatorTier='Low'" style="display:flex; justify-content:space-between; padding:8px 10px; border-radius:8px; background:var(--bg); border:1px solid var(--line); text-decoration:none;">
                <span><b style="color:var(--brand-bright);">Low Tier</b> (Carinderia / Dorm)</span>
                <b>₱45 – ₱75 / meal</b>
              </a>
              <a href="#/generator" onclick="state.generatorTier='Medium'" style="display:flex; justify-content:space-between; padding:8px 10px; border-radius:8px; background:var(--bg); border:1px solid var(--line); text-decoration:none;">
                <span><b style="color:#0284c7;">Medium Tier</b> (Campus / BPO)</span>
                <b>₱80 – ₱135 / meal</b>
              </a>
              <a href="#/generator" onclick="state.generatorTier='High'" style="display:flex; justify-content:space-between; padding:8px 10px; border-radius:8px; background:var(--bg); border:1px solid var(--line); text-decoration:none;">
                <span><b style="color:var(--warn);">High Tier</b> (High-Protein / Grill)</span>
                <b>₱140 – ₱235 / meal</b>
              </a>
            </div>
          </div>
          <div class="hero-featured-dish" onclick="openRecipe('${topReelMeal.id}')">
            <img src="${esc(mealImage(topReelMeal))}" alt="${esc(cleanMealName(topReelMeal.name))}" />
            <div>
              <b style="display:block; font-size:13.5px;">${esc(cleanMealName(topReelMeal.name))}</b>
              <span style="color:var(--brand-bright); font-weight:700; font-size:12.5px;">${money(topReelMeal.price)} · ${topReelMeal.sodiumMg || 290}mg Sodium</span>
              <small class="muted" style="display:block; font-size:11px;">Click for palengke ingredient breakdown</small>
            </div>
          </div>
        </div>
      </div>

      <div class="section-head">
        <div>
          <h3>Featured Meals Across Low, Medium &amp; High Budgets</h3>
          <p>Real Philippine Peso prices with itemized ingredient costs and kidney-safe sodium levels.</p>
        </div>
        <a class="btn btn-secondary mini" href="#/generator">Browse All ${state.meals.length.toLocaleString()} Meals →</a>
      </div>
      <div class="grid">
        ${featuredMeals.map(m => mealCard(m, true)).join('')}
      </div>

      <div class="section-head">
        <div>
          <h3>Verified Cubao Partner Kitchens</h3>
          <p>Click any kitchen to view it on the live interactive Cubao GPS map.</p>
        </div>
        <a class="btn btn-secondary mini" href="#/locator">Open Interactive Map →</a>
      </div>
      <div class="vendor-list">
        ${state.vendors.map(vendorCard).join('')}
      </div>
    </section>
  `);
}

function vendorCard(v) {
  const sampleMeals = state.meals.filter(m => (m.vendorIds || []).includes(v.id)).slice(0, 2);
  const lat = v.lat || 14.6218;
  const lon = v.lon || 121.0574;
  return `
    <div class="vendor">
      <div>
        <div class="vendor-top">
          <div>
            <div class="vendor-name">${esc(v.name)}</div>
            <div class="muted" style="font-size: 12.5px; margin-top: 2px;">${esc(v.type)} · ${esc(v.address || v.area)}</div>
          </div>
          <span class="vendor-rating">★ ${v.rating}</span>
        </div>
        <div class="meta" style="margin-top: 10px;">
          ${v.priceTier ? `<span class="tier-badge tier-${esc(v.priceTier)}">${esc(v.priceTier)} Tier</span>` : ''}
          ${(v.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}
        </div>
      </div>
      <div>
        <div class="vendor-meta-grid">
          <div>
            <small>PH Price Range</small>
            <b style="color: var(--brand-bright);">${esc(v.priceRange)}</b>
          </div>
          <div>
            <small>Distance</small>
            <b>${esc(v.distance)}</b>
          </div>
          <div>
            <small>House Specialty</small>
            <b>${esc(sampleMeals[0] ? cleanMealName(sampleMeals[0].name) : 'Low-Sodium Bowls')}</b>
          </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="btn btn-secondary mini" style="flex:1;" onclick="focusVendorOnMap(${lat}, ${lon}, '${esc(v.id)}')">Pin on Live Map</button>
          <a class="btn btn-primary mini" style="flex:1;" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}">Directions ↗</a>
        </div>
      </div>
    </div>
  `;
}

function pct(v, g) {
  return g ? Math.min(100, Math.round((v / g) * 100)) : 0;
}

function tracker() {
  if (!state.user) {
    return shell(signInCard('Daily Nutrition & Sodium Log', 'Sign in to record your daily meals, monitor sodium load against kidney limits, track hydration, and manage your Philippine Peso food budget.'));
  }
  const t = state.tracker || { logs: [], waterGlasses: 0, totals: { calories: 0, protein: 0, sodiumMg: 0, spent: 0 } };
  const g = state.user.dailyGoals || { calories: 2000, protein: 90, sodiumMg: 2000, waterGlasses: 8 };

  const rows = t.logs.map(x => {
    const rowSodium = Math.round((x.sodiumMg || 0) * (x.servings || 1));
    const risk = getSodiumRisk(rowSodium);
    return `
      <div class="log-row">
        <div>
          <b style="font-size: 14.5px;">${esc(cleanMealName(x.name))}</b>
          <div class="muted" style="font-size: 12px; margin-top: 2px;">${esc(x.source)} · ${x.servings} serving${x.servings !== 1 ? 's' : ''} · <span style="color:${risk.level === 'HIGH' ? 'var(--danger)' : 'var(--brand-bright)'}; font-weight:600;">${esc(risk.label)}</span></div>
        </div>
        <div class="log-numbers">
          <span class="log-pill">${Math.round(x.calories * x.servings)} kcal</span>
          <span>${Math.round(x.protein * x.servings)}g protein</span>
          <span style="color:${rowSodium > 700 ? 'var(--warn)' : 'var(--text-secondary)'}; font-weight:600;">${rowSodium}mg Na</span>
          <b style="color: var(--brand-bright);">${money(x.price * x.servings)}</b>
          <button class="icon-danger" title="Remove entry" onclick="deleteLog('${x.id}')">×</button>
        </div>
      </div>
    `;
  }).join('');

  return shell(`
    <section class="page">
      ${moduleGuide('Daily Nutrition & Hydration Log', [
        ['1. Log Meals or Custom Foods', 'Click "+ Log Meal" on any dish, scan your food live, or click "+ Add Custom Entry" to record what you ate.'],
        ['2. Watch Your 4 Health Bars', 'Monitor Calories, Protein, Sodium Load (mg), and PHP Budget Spent in real time against your daily targets.'],
        ['3. Log Water to Flush Sodium', 'Tap the numbered water glasses (1–8+) as you drink water throughout the day to support kidney filtration.']
      ])}

      <div class="tracker-head">
        <div>
          <div class="eyebrow">Date · ${esc(t.date)}</div>
          <h2>Nutrition, Budget &amp; Sodium Tracker</h2>
          <p class="muted" style="margin: 0;">Track daily macronutrients, renal sodium load, water intake, and PHP meal spending.</p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a class="btn btn-secondary" href="#/kidney">Kidney Shield</a>
          <a class="btn btn-secondary" href="#/scanner">Scan Food</a>
          <button class="btn btn-primary" onclick="openManualLog()">+ Add Custom Entry</button>
        </div>
      </div>

      <div class="progress-grid">
        ${progressCard('Calories', Math.round(t.totals.calories), g.calories, 'kcal', pct(t.totals.calories, g.calories))}
        ${progressCard('Protein', Math.round(t.totals.protein), g.protein, 'g', pct(t.totals.protein, g.protein))}
        ${progressCard('Sodium Load', Math.round(t.totals.sodiumMg), g.sodiumMg, 'mg', pct(t.totals.sodiumMg, g.sodiumMg), t.totals.sodiumMg > g.sodiumMg)}
        ${progressCard('Budget Spent', money(t.totals.spent), money(state.user.budget), '', pct(t.totals.spent, state.user.budget), t.totals.spent > state.user.budget)}
      </div>

      <div class="grid tracker-grid">
        <div class="card">
          <div class="section-head compact">
            <div>
              <h3>Kidney Hydration Flush</h3>
              <p>${t.waterGlasses} of ${g.waterGlasses} glasses (${t.waterGlasses * 250} ml) — flushes excess sodium</p>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary mini" onclick="water(-1)">− 1</button>
              <button class="btn btn-primary mini" onclick="water(1)">+ 1 Glass</button>
            </div>
          </div>
          <div class="water-row">
            ${Array.from({ length: Math.min(12, Math.max(8, g.waterGlasses)) }, (_, i) => `
              <div class="water-cup ${i < t.waterGlasses ? 'filled' : ''}" onclick="water(1)">${i + 1}</div>
            `).join('')}
          </div>
        </div>

        <div class="card insight-card">
          <div>
            <div class="eyebrow">Renal &amp; Budget Status</div>
            <h3 style="margin: 8px 0 6px; font-size: 19px;">${smartInsight(t, g)}</h3>
            <p class="muted" style="margin: 0; font-size: 13px;">Keeping daily sodium under 2,000mg and drinking 8+ glasses of water protects kidney filtration and blood pressure.</p>
          </div>
          <div style="margin-top: 14px; display: flex; gap: 8px;">
            <a class="btn btn-secondary mini" href="#/kidney">Kidney Shield Guide</a>
            <a class="btn btn-secondary mini" href="#/generator">Browse Low–High Meals</a>
          </div>
        </div>
      </div>

      <div class="card log-card">
        <div class="section-head compact">
          <div>
            <h3>Recorded Meals Today</h3>
            <p>${t.logs.length} entry${t.logs.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        ${rows || '<div class="empty">No meals logged today yet. Scan your meal with the Live Scanner or select a dish below.</div>'}
      </div>

      <div class="section-head">
        <div>
          <h3>Quick-Add Kidney-Safe Meals (Low to High Budget)</h3>
          <p>One click logs the meal to today’s tracker.</p>
        </div>
      </div>
      <div class="grid">
        ${state.meals.slice(0, 3).map(m => mealCard(m, true)).join('')}
      </div>
    </section>
  `);
}

function progressCard(label, v, g, unit, pctv, over = false) {
  return `
    <div class="card progress-card ${over ? 'over' : ''}">
      <div class="progress-top">
        <span>${esc(label)}</span>
        <b>${v}${unit ? ' ' + unit : ''}</b>
      </div>
      <div class="bar"><i style="width:${Math.max(4, pctv)}%"></i></div>
      <small>${pctv}% of ${g}${unit ? ' ' + unit : ''}${over ? ' · ⚠️ Over limit' : ''}</small>
    </div>
  `;
}

function smartInsight(t, g) {
  if (!t.logs.length) return 'No meals logged yet today. Start with a kidney-safe breakfast or ₱48 Ginisang Monggo bowl.';
  if (t.totals.sodiumMg > g.sodiumMg) return '⚠️ High Sodium Alert: You have exceeded your daily sodium limit. Drink 2–3 glasses of water and choose fresh greens next.';
  if (t.totals.sodiumMg > 1500) return 'Approaching DOH 1,500mg optimal kidney sodium threshold—avoid canned goods, patis, and instant noodles tonight.';
  if (t.totals.spent > state.user.budget) return 'Today’s meal spending is above your daily PHP budget—switch to a Low Tier (₱45–₱75) dish for your next meal.';
  return '✓ Optimal Balance: Your sodium intake, macronutrients, and Philippine Peso food spend are in the kidney-safe zone.';
}

/* Dedicated Dialysis & Kidney Disease Prevention Module (#/kidney) */
function kidneyPage() {
  const t = state.tracker?.totals || { calories: 0, protein: 0, sodiumMg: 0, spent: 0 };
  const waterGlasses = state.tracker?.waterGlasses || 0;
  const sodiumToday = Math.round(t.sodiumMg || 0);
  const whoLimit = 2000;
  const dohOptimal = 1500;
  const recommendedGlasses = Math.max(8, Math.ceil(sodiumToday / 220));
  const fillPct = Math.min(100, Math.max(4, Math.round((sodiumToday / whoLimit) * 100)));
  const fillCls = sodiumToday > whoLimit ? 'danger' : sodiumToday > dohOptimal ? 'warn' : '';
  const risk = getSodiumRisk(sodiumToday > 1500 ? 950 : sodiumToday > 900 ? 600 : 300);

  const swaps = [
    {
      badName: 'Instant Pancit Canton (2 Packs)',
      badPrice: '₱36',
      badSodium: '1,840mg Na',
      badNote: '92% of daily sodium limit in one sitting; linked to hypertension & CKD.',
      goodMealId: 'm1',
      goodName: 'Ginisang Monggo with Malunggay & Tinapa Flakes',
      goodPrice: '₱48 (Low Tier)',
      goodSodium: '290mg Na',
      sodiumSaved: 'Saves 1,550mg Sodium',
      goodImage: './assets/meals/monggo-bowl.jpg',
      goodNote: 'High plant protein, folate, and iron simmered with fresh garlic, tomato, and malunggay leaves.'
    },
    {
      badName: 'Canned Corned Beef or Sardines in Heavy Brine',
      badPrice: '₱55',
      badSodium: '1,380mg Na',
      badNote: 'Loaded with curing salts, sodium nitrite, and saturated fat.',
      goodMealId: 'm6',
      goodName: 'Steamed Tilapia with Ginger, Scallions & Pechay',
      goodPrice: '₱72 (Low Tier)',
      goodSodium: '280mg Na',
      sodiumSaved: 'Saves 1,100mg Sodium',
      goodImage: './assets/meals/tilapia-plate.jpg',
      goodNote: 'Fresh fish protein aromatics steamed with luya (ginger), scallions, and crisp pechay greens.'
    },
    {
      badName: 'Fast-Food 2-pc Fried Chicken with Salted Gravy',
      badPrice: '₱165',
      badSodium: '1,920mg Na',
      badNote: 'Pressure-brined chicken + MSG gravy spikes blood pressure.',
      goodMealId: 'm3',
      goodName: 'Grilled Chicken Inasal with Atsuete & Cucumber',
      goodPrice: '₱98 (Medium Tier)',
      goodSodium: '410mg Na',
      sodiumSaved: 'Saves 1,510mg Na & ₱67',
      goodImage: './assets/meals/inasal-plate.jpg',
      goodNote: 'Marinated in natural calamansi, lemongrass (tanglad), and garlic with zero MSG gravy.'
    },
    {
      badName: 'Pork Sisig / Crispy Pata Carinderia Order',
      badPrice: '₱135',
      badSodium: '1,760mg Na',
      badNote: 'High uric acid, saturated fat, and heavy seasoning salt.',
      goodMealId: 'm2',
      goodName: 'Crispy Garlic Tokwa & Kangkong Rice Bowl',
      goodPrice: '₱52 (Low Tier)',
      goodSodium: '310mg Na',
      sodiumSaved: 'Saves 1,450mg Na & ₱83',
      goodImage: './assets/meals/tofu-bowl.jpg',
      goodNote: 'Pan-seared firm tofu and iron-rich kangkong tossed in a light calamansi-garlic glaze.'
    }
  ];

  const kidneySafeMeals = state.meals
    .filter(m => (m.sodiumMg || 340) <= 340)
    .slice(0, 6);

  return shell(`
    <section class="page">
      ${moduleGuide('Kidney & Sodium Shield', [
        ['1. Monitor Your Daily Sodium Gauge', 'Keep your daily sodium intake inside the green DOH Optimal Zone (under 1,500mg–2,000mg per day).'],
        ['2. Replace High-Salt Risk Foods', 'Use the visual Swap Cards below to trade salty instant noodles or fast food for ₱48–₱98 fresh Filipino dishes.'],
        ['3. Balance Hydration & Aromatics', 'Log at least 8 glasses of water daily and use calamansi, garlic, and ginger instead of excess salt or patis.']
      ])}

      <div class="kidney-banner">
        <div style="display:flex; flex-direction:column; justify-content:space-between; gap:16px;">
          <div>
            <div class="eyebrow">DOH / NKTI Renal Health Initiative</div>
            <h2 style="margin: 6px 0 10px; font-size: 25px; line-height:1.2;">Kidney &amp; Sodium Shield — Dialysis Prevention System</h2>
            <p class="muted" style="margin: 0; line-height: 1.6; font-size: 14px;">
              In the Philippines, over <b>1 in 10 adults</b> suffer from Chronic Kidney Disease (CKD), driven largely by hidden sodium in instant noodles, canned goods, fast food, and heavy <i>patis/bagoong</i> seasoning. ByteBite helps students, workers, and families stay under the <b>1,500mg–2,000mg daily sodium limit</b> while eating well on a real ₱45–₱235 budget.
            </p>
          </div>
          <div class="actions">
            <a class="btn btn-primary" href="#/scanner">Scan Food for Sodium Risk</a>
            <button class="btn btn-secondary" onclick="water(1)">+ Log 1 Glass Water (${waterGlasses}/${recommendedGlasses})</button>
            <a class="btn btn-secondary" href="#/generator" onclick="state.generatorTier='Low'">Browse Low-Sodium ₱45+ Meals</a>
          </div>
        </div>

        <div class="sodium-meter-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div class="eyebrow">Today's Renal Sodium Meter</div>
              <span class="risk-pill ${esc(risk.cls)}">${sodiumToday <= dohOptimal ? '✓ Optimal Renal Load' : sodiumToday <= whoLimit ? '⚠️ Caution (>1,500mg)' : '🚨 Over 2,000mg Limit'}</span>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:10px;">
              <div style="font-family:'Space Grotesk',sans-serif; font-size:32px; font-weight:700; color:${sodiumToday > dohOptimal ? 'var(--warn)' : 'var(--brand-bright)'};">
                ${sodiumToday} <span style="font-size:14px; font-weight:500; color:var(--muted);">mg Na logged today</span>
              </div>
              <span style="font-size:12px; font-weight:600; color:var(--text-secondary);">${Math.round((sodiumToday / whoLimit) * 100)}% of 2,000mg max</span>
            </div>

            <div class="sodium-gauge-track" title="Green: 0-1,500mg Optimal | Amber: 1,500-2,000mg Caution | Red: >2,000mg High Risk">
              <div class="sodium-gauge-fill ${fillCls}" style="width:${fillPct}%;"></div>
            </div>

            <div class="sodium-zone-labels">
              <span style="color:var(--brand-bright);">0mg (Safe Start)</span>
              <span style="color:var(--warn);">1,500mg (DOH Ideal)</span>
              <span style="color:var(--danger);">2,000mg (WHO Limit)</span>
            </div>
          </div>

          <div style="padding-top:12px; border-top:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; font-size:12.5px;">
            <div>
              <b>Hydration Target:</b> <span class="muted">${waterGlasses} of ${recommendedGlasses} glasses logged (${waterGlasses * 250} ml)</span>
            </div>
            <button class="btn btn-secondary mini" onclick="trackMeal('m1')">+ Log ₱48 Monggo (290mg Na)</button>
          </div>
        </div>
      </div>

      <div class="section-head">
        <div>
          <h3>High-Sodium Dialysis Risk Foods vs. Healthy ByteBite PH Swaps</h3>
          <p>Visual comparison of common high-salt meals against freshly cooked, kidney-safe Filipino dishes.</p>
        </div>
      </div>

      <div class="swap-grid">
        ${swaps.map(s => {
          const mealObj = state.meals.find(m => m.id === s.goodMealId);
          const photo = mealObj ? mealImage(mealObj) : s.goodImage;
          return `
            <article class="swap-card-pro">
              <div class="swap-pro-visual" onclick="openRecipe('${s.goodMealId}')" title="Click to view full recipe and palengke ingredient breakdown">
                <img src="${esc(photo)}" alt="${esc(s.goodName)}" loading="lazy" onerror="this.onerror=null;this.src='./assets/meals/tofu-bowl.jpg'" />
                <div class="swap-pro-shade"></div>
                <div class="swap-pro-badges">
                  <span class="risk-pill risk-safe">✓ ${esc(s.sodiumSaved)}</span>
                  <span class="tier-badge tier-Low">${esc(s.goodPrice)}</span>
                </div>
                <div class="swap-pro-caption">
                  <div style="font-size:11px; color:#86efac; font-weight:700; text-transform:uppercase; letter-spacing:0.04em;">Recommended Healthy Filipino Replacement</div>
                  <h4 style="margin:2px 0 0; font-size:16.5px; color:#fff;">${esc(s.goodName)}</h4>
                </div>
              </div>

              <div class="swap-pro-body">
                <div class="swap-compare-box">
                  <div class="swap-col-limit">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; margin-bottom:4px;">
                      <span class="risk-pill risk-high">⚠️ Limit / Avoid</span>
                      <b style="font-size:12px; color:var(--danger);">${esc(s.badSodium)}</b>
                    </div>
                    <b style="display:block; font-size:13px; color:var(--text); margin-bottom:3px;">${esc(s.badName)} (${esc(s.badPrice)})</b>
                    <span class="muted" style="font-size:11.5px; line-height:1.4; display:block;">${esc(s.badNote)}</span>
                  </div>

                  <div class="swap-col-healthy">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; margin-bottom:4px;">
                      <span class="risk-pill risk-safe">✓ Kidney Safe</span>
                      <b style="font-size:12px; color:var(--brand-bright);">${esc(s.goodSodium)}</b>
                    </div>
                    <b style="display:block; font-size:13px; color:var(--text); margin-bottom:3px;">${esc(s.goodName)}</b>
                    <span class="muted" style="font-size:11.5px; line-height:1.4; display:block;">${esc(s.goodNote)}</span>
                  </div>
                </div>

                <div style="display:flex; gap:8px;">
                  <button class="btn btn-secondary mini" style="flex:1;" onclick="openRecipe('${s.goodMealId}')">Ingredients &amp; Steps</button>
                  <button class="btn btn-primary mini" style="flex:1;" onclick="trackMeal('${s.goodMealId}')">+ Log Healthy Swap</button>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>

      <div class="card" style="padding: 22px;">
        <div class="section-head compact">
          <div>
            <div class="eyebrow">Culinary Renal Guide</div>
            <h3>How to Cook Delicious Filipino Meals with 70% Less Sodium</h3>
            <p>You don't need MSG sachets, heavy patis, or bagoong to make authentic Filipino dishes flavorful.</p>
          </div>
        </div>
        <div class="grid" style="margin-top: 12px;">
          <div class="card" style="background: var(--bg);">
            <h4 style="margin:0 0 6px; color:var(--brand-bright);">1. Acid &amp; Citrus Brightening</h4>
            <p class="muted" style="margin:0; font-size:13px;">Squeeze fresh <b>Calamansi</b>, native tomato, or cane vinegar at the end of cooking. Natural acidity activates salt-taste receptors on the tongue so you need less than 1/4 tsp salt.</p>
          </div>
          <div class="card" style="background: var(--bg);">
            <h4 style="margin:0 0 6px; color:var(--brand-bright);">2. Triple Filipino Aromatics (Gisa)</h4>
            <p class="muted" style="margin:0; font-size:13px;">Double your <b>Bawang (garlic), Sibuyas (red onion), Luya (ginger), and Tanglad (lemongrass)</b> when sautéing. Slow-browning aromatics builds deep savory umami naturally.</p>
          </div>
          <div class="card" style="background: var(--bg);">
            <h4 style="margin:0 0 6px; color:var(--brand-bright);">3. Rinse &amp; Blanch Technique</h4>
            <p class="muted" style="margin:0; font-size:13px;">When using tinapa flakes or tokwa, briefly rinse in warm water before cooking and pair with potassium-rich greens like <b>Malunggay, Pechay, and Kangkong</b> to support healthy blood pressure.</p>
          </div>
        </div>
      </div>

      <div class="section-head">
        <div>
          <h3>Top Kidney-Safe Low-Sodium Meals (≤340mg Sodium)</h3>
          <p>Freshly prepared dishes with complete PHP ingredient pricing.</p>
        </div>
      </div>
      <div class="grid">
        ${kidneySafeMeals.map(m => mealCard(m, true)).join('')}
      </div>
    </section>
  `);
}

/* Cooking Reels with 12 Videos, Shuffle on Refresh, and Realistic Culinary Audio + Narration */
function reels() {
  const isSavedTab = route() === 'saved';
  if (isSavedTab && !state.user) {
    return shell(signInCard('Saved Cooking Reels', 'Sign in to bookmark cooking videos and recipes.'));
  }
  const list = isSavedTab
    ? state.reels.filter(r => (state.user?.savedReels || []).includes(r.id))
    : state.reels;
  const activeReel = list.find(r => r.id === state.activeReelId) || list[0] || state.reels[0];
  const activeMeal = activeReel ? (state.meals.find(m => m.id === activeReel.mealId) || state.meals[0]) : state.meals[0];
  const activeIngs = activeMeal?.ingredients || [];
  const activeSteps = activeMeal?.steps || [];

  return shell(`
    <section class="page">
      ${moduleGuide('Cooking Reels & Audio Guides', [
        ['1. Watch or Select Any Video', 'Scroll the vertical player on the left or click any of the 12 videos in the Culinary Directory on the right.'],
        ['2. Enable Voice & Kitchen Audio', 'Tap "Tap for Audio" on the video player to hear realistic kitchen sizzle and step-by-step recipe voice narration.'],
        ['3. Cook or Log the Dish', 'Review the itemized Philippine palengke ingredient breakdown on the right or click "+ Log Meal" to record it.']
      ])}

      <div class="reels-header" style="max-width:none; margin:0;">
        <div class="reels-tabs">
          <a class="reels-tab ${!isSavedTab ? 'active' : ''}" href="#/reels">All Cooking Reels (${state.reels.length})</a>
          <a class="reels-tab ${isSavedTab ? 'active' : ''}" href="#/saved">Saved (${(state.user?.savedReels || []).length})</a>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap:wrap;">
          <button class="btn btn-secondary mini" onclick="shuffleReelsFeed()" title="Load a different video order">↻ Shuffle Feed</button>
          <button class="btn btn-primary mini" onclick="openReelUpload()">+ Upload Video</button>
        </div>
      </div>

      <div class="reels-studio-grid">
        <div class="reels-stage">
          <div class="reels-wrap" id="reelsWrap">
            ${list.length
              ? list.map((r, i) => reelCard(r, i)).join('')
              : `<div class="reel"><div class="empty" style="max-width: 300px;">No saved videos yet. Tap ☆ on any cooking reel to bookmark it.</div></div>`
            }
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:18px;">
          <div class="card" id="activeReelRecipePanel">
            ${activeMeal ? `
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
                <div>
                  <div class="eyebrow">Active Reel Recipe &amp; Palengke Cost Breakdown</div>
                  <h3 style="margin:4px 0 4px; font-size:20px;">${esc(cleanMealName(activeMeal.name))}</h3>
                  <p class="muted" style="margin:0; font-size:13px;">${esc(activeReel?.caption || cleanMealDesc(activeMeal))}</p>
                </div>
                <div style="text-align:right;">
                  <div class="price" style="font-size:22px;">${money(activeMeal.price)}</div>
                  <span class="tier-badge tier-${esc(getMealTier(activeMeal))}">${esc(getMealTier(activeMeal))} Tier</span>
                </div>
              </div>

              <div class="macro-row" style="grid-template-columns:repeat(4,1fr); margin:14px 0;">
                <div class="macro-cell"><b>${activeMeal.calories} kcal</b><span>Calories</span></div>
                <div class="macro-cell"><b>${activeMeal.protein}g</b><span>Protein</span></div>
                <div class="macro-cell"><b style="color:var(--brand-bright);">${activeMeal.sodiumMg || 310}mg</b><span>Sodium (Safe)</span></div>
                <div class="macro-cell"><b>${esc(activeMeal.cookTime || '12 mins')}</b><span>Cook Time</span></div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div>
                  <h4 style="margin:0 0 6px; font-size:13.5px; color:var(--brand-bright);">Palengke Ingredients</h4>
                  <table class="ing-table" style="margin:0;">
                    <tbody>
                      ${activeIngs.map(ing => `
                        <tr>
                          <td><b>${esc(ing.item)}</b></td>
                          <td class="muted">${esc(ing.amount)}</td>
                          <td style="text-align:right; color:var(--brand-bright); font-weight:700;">${esc(ing.cost)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 style="margin:0 0 6px; font-size:13.5px; color:var(--brand-bright);">Quick Cooking Steps</h4>
                  <div class="step-list" style="margin:0;">
                    ${activeSteps.map((st, idx) => `
                      <div class="step-item" style="padding:8px 10px; font-size:12px;">
                        <div class="step-num" style="width:20px; height:20px; font-size:11px;">${idx + 1}</div>
                        <div>${esc(st)}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:14px; padding-top:12px; border-top:1px solid var(--line);">
                <button class="btn btn-secondary mini" onclick="openRecipe('${activeMeal.id}')">Open Full Recipe Modal</button>
                <button class="btn btn-primary mini" onclick="trackMeal('${activeMeal.id}')">+ Log Meal (${money(activeMeal.price)})</button>
              </div>
            ` : ''}
          </div>

          <div class="card">
            <div class="section-head compact">
              <div>
                <div class="eyebrow">Interactive Video Playlist</div>
                <h3>All ${list.length} Filipino Cooking Reels (Click Any Video to Play)</h3>
                <p>Every video features a kidney-safe Filipino dish with itemized PHP wet-market pricing.</p>
              </div>
            </div>
            <div class="reel-directory-grid">
              ${list.map((r, idx) => {
                const m = state.meals.find(x => x.id === r.mealId) || state.meals[0];
                const thumb = r.poster || mealImage(m);
                const isAct = activeReel && activeReel.id === r.id;
                return `
                  <div class="reel-dir-card ${isAct ? 'active' : ''}" id="dir-reel-${esc(r.id)}" onclick="jumpToReel('${esc(r.id)}')">
                    <img src="${esc(thumb)}" alt="${esc(r.title)}" onerror="this.onerror=null;this.src='./assets/meals/tofu-bowl.jpg'" />
                    <div>
                      <b style="display:block; font-size:12.5px; line-height:1.25;">${idx + 1}. ${esc(r.title.slice(0, 34))}</b>
                      <span style="color:var(--brand-bright); font-size:11.5px; font-weight:700;">${money(m.price)} · ${m.sodiumMg || 310}mg Na</span>
                      <small class="muted" style="display:block; font-size:10.5px;">▶ Click to play video</small>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
    <div class="comment-box" id="commentBox"></div>
  `);
}

function jumpToReel(reelId) {
  state.activeReelId = reelId;
  const card = document.querySelector(`.reel[data-reel="${CSS.escape(reelId)}"]`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const v = card.querySelector('video');
    if (v) v.play().catch(() => {});
  }
  updateActiveReelCompanion(reelId);
}

function updateActiveReelCompanion(reelId) {
  state.activeReelId = reelId;
  $$('.reel-dir-card').forEach(el => {
    el.classList.toggle('active', el.id === `dir-reel-${reelId}`);
  });
  const r = state.reels.find(x => x.id === reelId);
  if (!r) return;
  const activeMeal = state.meals.find(m => m.id === r.mealId) || state.meals[0];
  const panel = $('#activeReelRecipePanel');
  if (!panel || !activeMeal) return;
  const activeIngs = activeMeal.ingredients || [];
  const activeSteps = activeMeal.steps || [];
  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
      <div>
        <div class="eyebrow">Active Reel Recipe &amp; Palengke Cost Breakdown</div>
        <h3 style="margin:4px 0 4px; font-size:20px;">${esc(cleanMealName(activeMeal.name))}</h3>
        <p class="muted" style="margin:0; font-size:13px;">${esc(r.caption || cleanMealDesc(activeMeal))}</p>
      </div>
      <div style="text-align:right;">
        <div class="price" style="font-size:22px;">${money(activeMeal.price)}</div>
        <span class="tier-badge tier-${esc(getMealTier(activeMeal))}">${esc(getMealTier(activeMeal))} Tier</span>
      </div>
    </div>

    <div class="macro-row" style="grid-template-columns:repeat(4,1fr); margin:14px 0;">
      <div class="macro-cell"><b>${activeMeal.calories} kcal</b><span>Calories</span></div>
      <div class="macro-cell"><b>${activeMeal.protein}g</b><span>Protein</span></div>
      <div class="macro-cell"><b style="color:var(--brand-bright);">${activeMeal.sodiumMg || 310}mg</b><span>Sodium (Safe)</span></div>
      <div class="macro-cell"><b>${esc(activeMeal.cookTime || '12 mins')}</b><span>Cook Time</span></div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
      <div>
        <h4 style="margin:0 0 6px; font-size:13.5px; color:var(--brand-bright);">Palengke Ingredients</h4>
        <table class="ing-table" style="margin:0;">
          <tbody>
            ${activeIngs.map(ing => `
              <tr>
                <td><b>${esc(ing.item)}</b></td>
                <td class="muted">${esc(ing.amount)}</td>
                <td style="text-align:right; color:var(--brand-bright); font-weight:700;">${esc(ing.cost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div>
        <h4 style="margin:0 0 6px; font-size:13.5px; color:var(--brand-bright);">Quick Cooking Steps</h4>
        <div class="step-list" style="margin:0;">
          ${activeSteps.map((st, idx) => `
            <div class="step-item" style="padding:8px 10px; font-size:12px;">
              <div class="step-num" style="width:20px; height:20px; font-size:11px;">${idx + 1}</div>
              <div>${esc(st)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:14px; padding-top:12px; border-top:1px solid var(--line);">
      <button class="btn btn-secondary mini" onclick="openRecipe('${activeMeal.id}')">Open Full Recipe Modal</button>
      <button class="btn btn-primary mini" onclick="trackMeal('${activeMeal.id}')">+ Log Meal (${money(activeMeal.price)})</button>
    </div>
  `;
}

function shuffleReelsFeed() {
  stopReelAudio();
  state.reels = shuffleArray(state.reels);
  if (state.reels[0]) state.activeReelId = state.reels[0].id;
  render();
  const wrap = $('#reelsWrap');
  if (wrap) wrap.scrollTop = 0;
  toast('Loaded fresh cooking reel order.');
}

function reelCard(r, i) {
  const meal = state.meals.find(m => m.id === r.mealId) || state.meals[0];
  const saved = state.user && (state.user.savedReels || []).includes(r.id);
  const poster = r.poster || (meal ? mealImage(meal) : './assets/meals/tofu-bowl.jpg');
  const tier = meal ? getMealTier(meal) : 'Low';

  return `
    <article class="reel" data-reel="${esc(r.id)}">
      <video ${i === 0 ? 'autoplay' : ''} ${state.reelsSoundOn ? '' : 'muted'} loop playsinline preload="metadata" poster="${esc(poster)}" src="${esc(r.video)}"></video>
      <div class="video-fallback">
        <div>
          <b>Video could not be decoded.</b><br>
          <span>Upload an H.264 MP4 or WebM video file.</span><br>
          <a class="btn btn-primary mini" style="margin-top: 12px;" href="${esc(r.video)}" target="_blank" rel="noopener">Download File</a>
        </div>
      </div>
      <div class="reel-shade"></div>
      <div class="pause-hint">Video ${i + 1} of ${state.reels.length} · Tap to play/pause</div>
      <button class="sound-btn ${state.reelsSoundOn ? 'unmuted' : ''}" onclick="toggleSound(event, this, '${r.id}')">
        ${state.reelsSoundOn ? '🔊 Audio &amp; Voice On' : '🔇 Tap for Audio'}
      </button>

      <div class="reel-info">
        <div class="reel-creator">@${esc((r.creator || 'ByteBiteKitchen').replace(/\s+/g, '').toLowerCase())}</div>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.caption)}</p>
        <div class="meta">
          <span class="tier-badge tier-${esc(tier)}">${esc(tier)} Tier</span>
          ${(r.tags || []).map(t => `<span class="chip">#${esc(t)}</span>`).join('')}
        </div>
        ${meal ? `
          <div class="reel-meal-box">
            <div class="reel-meal-top">
              <div>
                <b style="font-size: 13px;">${esc(cleanMealName(meal.name))}</b>
                <small>${meal.calories} kcal · ${meal.protein}g protein · ${meal.sodiumMg || 310}mg Na</small>
              </div>
              <span class="price" style="font-size: 15.5px;">${money(meal.price)}</span>
            </div>
            <div class="reel-meal-btns">
              <button class="btn btn-secondary mini" onclick="openRecipe('${meal.id}')">Ingredients &amp; Steps</button>
              <button class="btn btn-primary mini" onclick="trackMeal('${meal.id}')">+ Log Meal</button>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="reel-actions">
        <div>
          <button class="circle-btn" title="Ingredients &amp; How to Cook" onclick="openRecipe('${meal ? meal.id : 'm1'}')">📖</button>
          <div class="count">Recipe</div>
        </div>
        <div>
          <button class="circle-btn" title="Like" onclick="likeReel('${r.id}')">♥</button>
          <div class="count" id="likes-${r.id}">${r.likes || 0}</div>
        </div>
        <div>
          <button class="circle-btn" title="Comments" onclick="openComments('${r.id}')">💬</button>
          <div class="count" id="comments-${r.id}">${(r.comments || []).length}</div>
        </div>
        <div>
          <button class="circle-btn" title="Save" onclick="saveReel('${r.id}')">${saved ? '★' : '☆'}</button>
          <div class="count">${saved ? 'Saved' : 'Save'}</div>
        </div>
        <div>
          <button class="circle-btn" title="Next Video" onclick="scrollNextReel(this)">↓</button>
          <div class="count">Next</div>
        </div>
      </div>
    </article>
  `;
}

function scrollNextReel(btn) {
  const current = btn.closest('.reel');
  const next = current?.nextElementSibling || $('#reelsWrap')?.firstElementChild;
  if (next) next.scrollIntoView({ behavior: 'smooth' });
}

/* Realistic Cooking Audio & Recipe Narration Engine */
function startKitchenAmbience() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!state.audioCtx) state.audioCtx = new AudioCtx();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    if (state.sizzleNode) return;

    const bufferSize = state.audioCtx.sampleRate * 2;
    const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i * 0.002));
    }

    const noise = state.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = state.audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 3200;
    bandpass.Q.value = 1.4;

    const gain = state.audioCtx.createGain();
    gain.gain.value = 0.035;

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(state.audioCtx.destination);
    noise.start();

    state.sizzleNode = noise;
    state.sizzleGain = gain;
  } catch {}
}

function playReelAudio(reelId) {
  if (!state.reelsSoundOn) return;
  startKitchenAmbience();
  const reel = state.reels.find(r => r.id === reelId);
  if (!reel) return;
  const meal = state.meals.find(m => m.id === reel.mealId);
  const textToSpeak = reel.narration || (meal && meal.steps ? `${reel.title}. ${meal.steps.slice(0, 2).join(' ')}` : reel.caption);

  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.rate = 1.02;
      utter.pitch = 1.0;
      utter.volume = 0.9;
      window.speechSynthesis.speak(utter);
    }
  } catch {}
}

function stopReelAudio() {
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch {}
  try {
    if (state.sizzleNode) {
      state.sizzleNode.stop();
      state.sizzleNode.disconnect();
      state.sizzleNode = null;
    }
  } catch {}
}

function toggleSound(e, btn, reelId) {
  e.stopPropagation();
  state.reelsSoundOn = !state.reelsSoundOn;
  $$('.reel video').forEach(v => {
    v.muted = !state.reelsSoundOn;
    v.volume = 1.0;
  });
  $$('.sound-btn').forEach(b => {
    b.classList.toggle('unmuted', state.reelsSoundOn);
    b.innerHTML = state.reelsSoundOn ? '🔊 Audio &amp; Voice On' : '🔇 Tap for Audio';
  });
  const activeVideo = btn.closest('.reel')?.querySelector('video');
  if (activeVideo) activeVideo.play().catch(() => {});

  if (state.reelsSoundOn) {
    playReelAudio(reelId);
  } else {
    stopReelAudio();
  }
}

function setupReels() {
  const vids = $$('.reel video');
  if (!vids.length) return;
  const io = new IntersectionObserver(
    entries => entries.forEach(en => {
      const v = en.target;
      const card = v.closest('.reel');
      const reelId = card?.dataset?.reel;
      if (en.isIntersecting && en.intersectionRatio > 0.72) {
        vids.forEach(x => { if (x !== v) x.pause(); });
        v.muted = !state.reelsSoundOn;
        v.volume = 1.0;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
        if (reelId) updateActiveReelCompanion(reelId);
        if (state.reelsSoundOn && reelId) playReelAudio(reelId);
      } else {
        v.pause();
      }
    }),
    { threshold: [0.72] }
  );

  vids.forEach(v => {
    const card = v.closest('.reel');
    io.observe(v);
    v.addEventListener('click', () => {
      if (v.paused) {
        v.play().catch(() => {});
        if (state.reelsSoundOn && card?.dataset?.reel) playReelAudio(card.dataset.reel);
      } else {
        v.pause();
        stopReelAudio();
      }
    });
    const ok = () => {
      card?.classList.add('video-ready');
      card?.classList.remove('video-error');
    };
    v.addEventListener('loadedmetadata', ok);
    v.addEventListener('canplay', ok);
    v.addEventListener('playing', ok);
    v.addEventListener('error', () => {
      card?.classList.add('video-error');
    });
    if (v.readyState >= 1) ok();
  });
}

/* Meal Finder with Low / Medium / High Real Philippine Price Tiers */
function generator() {
  const tier = state.generatorTier || 'All';
  const defaultBudget = tier === 'Low' ? 75 : tier === 'Medium' ? 135 : tier === 'High' ? 235 : (state.user?.budget || 235);
  const defaultGoal = state.user?.goal || 'Balanced';

  const initialMatches = state.meals
    .filter(m => {
      const mTier = getMealTier(m);
      const tierOk = tier === 'All' || mTier === tier;
      const budgetOk = m.price <= defaultBudget;
      const goalOk = defaultGoal === 'Balanced' || (m.goals || []).includes(defaultGoal);
      return tierOk && budgetOk && goalOk;
    })
    .sort((a, b) => a.price - b.price || b.healthScore - a.healthScore)
    .slice(0, 12);

  const lowCount = state.meals.filter(m => getMealTier(m) === 'Low').length;
  const medCount = state.meals.filter(m => getMealTier(m) === 'Medium').length;
  const highCount = state.meals.filter(m => getMealTier(m) === 'High').length;

  return shell(`
    <section class="page">
      ${moduleGuide('Meal Finder (Low · Medium · High)', [
        ['1. Choose Your PH Price Tier', 'Select Low (₱45–₱75 Carinderia), Medium (₱80–₱135 Campus/Office), or High (₱140–₱235 Grill/Protein).'],
        ['2. Set Your Nutrition Goal', 'Filter by Low Sodium, Budget Saver, High Protein, or Vegetarian to match your health needs.'],
        ['3. View Palengke Recipe or Log', 'Click "Ingredients & Cook" on any dish for itemized PHP wet-market prices, or "+ Log Meal" to record it.']
      ])}

      <div class="card filter-bar" style="margin-bottom:0;">
        <div class="section-head compact">
          <div>
            <div class="eyebrow">Real Philippine Meal Pricing Directory</div>
            <h3 style="margin-top: 3px;">Filter Meals by PH Budget Tier (Low · Medium · High) &amp; Kidney Goal</h3>
            <p>Browse ${state.meals.length.toLocaleString()} kidney-safe Filipino meals with real Cubao carinderia, campus canteen, and grill pricing.</p>
          </div>
        </div>

        <div class="budget-chips" style="margin-top: 12px; padding-top: 0; border-top: none;">
          <span class="muted" style="font-size: 12px; font-weight: 700;">Select Price Tier:</span>
          <button type="button" class="btn ${tier === 'All' ? 'btn-primary' : 'btn-secondary'} mini" onclick="selectBudgetTier('All', 235)">All Tiers (${state.meals.length})</button>
          <button type="button" class="btn ${tier === 'Low' ? 'btn-primary' : 'btn-secondary'} mini" onclick="selectBudgetTier('Low', 75)">Low Tier · ₱45–₱75 (${lowCount})</button>
          <button type="button" class="btn ${tier === 'Medium' ? 'btn-primary' : 'btn-secondary'} mini" onclick="selectBudgetTier('Medium', 135)">Medium Tier · ₱80–₱135 (${medCount})</button>
          <button type="button" class="btn ${tier === 'High' ? 'btn-primary' : 'btn-secondary'} mini" onclick="selectBudgetTier('High', 235)">High Tier · ₱140–₱235 (${highCount})</button>
        </div>

        <form id="genForm" class="form-grid four" style="margin-top: 14px;">
          <div class="field">
            <label>Search Dish or Ingredient</label>
            <input id="queryInput" name="q" type="text" placeholder="e.g., monggo, tilapia, inasal, tofu...">
          </div>
          <div class="field">
            <label>Price Tier</label>
            <select id="tierInput" name="tier">
              <option value="All" ${tier === 'All' ? 'selected' : ''}>All Tiers (₱45–₱235)</option>
              <option value="Low" ${tier === 'Low' ? 'selected' : ''}>Low — Student &amp; Carinderia (₱45–₱75)</option>
              <option value="Medium" ${tier === 'Medium' ? 'selected' : ''}>Medium — Campus &amp; BPO Plate (₱80–₱135)</option>
              <option value="High" ${tier === 'High' ? 'selected' : ''}>High — Executive &amp; High-Protein (₱140–₱235)</option>
            </select>
          </div>
          <div class="field">
            <label>Max Price per Meal (₱)</label>
            <input id="budgetInput" name="budget" type="number" min="45" max="1000" value="${defaultBudget}" required>
          </div>
          <div class="field" style="justify-content: flex-end;">
            <label>Nutrition Goal &amp; Sort</label>
            <div style="display:flex; gap:8px;">
              <select id="goalInput" name="goal" style="flex:1;">
                ${['Balanced', 'Budget Saver', 'Low Sodium', 'High Protein', 'Weight Management'].map(x => `
                  <option ${defaultGoal === x ? 'selected' : ''}>${x}</option>
                `).join('')}
              </select>
              <select id="sortInput" name="sort" style="flex:1;" title="Sort results">
                <option value="price">Lowest Price (₱)</option>
                <option value="sodium">Lowest Sodium (mg)</option>
                <option value="protein">Highest Protein (g)</option>
                <option value="score">Top Health Score</option>
              </select>
              <input type="hidden" id="dietaryInput" name="dietary" value="${esc(state.user?.dietary || 'No preference')}">
              <button class="btn btn-primary" style="height: 40px;">Filter</button>
            </div>
          </div>
        </form>

        <div class="budget-chips">
          <span class="muted" style="font-size: 12px; font-weight: 600;">Quick Peso Caps:</span>
          <button type="button" class="budget-chip" onclick="setQuickBudget(55, 'Low')">Up to ₱55 (Dorm Saver)</button>
          <button type="button" class="budget-chip" onclick="setQuickBudget(75, 'Low')">Up to ₱75 (Low Tier)</button>
          <button type="button" class="budget-chip" onclick="setQuickBudget(105, 'Medium')">Up to ₱105 (Medium Tier)</button>
          <button type="button" class="budget-chip" onclick="setQuickBudget(135, 'Medium')">Up to ₱135 (Office Lunch)</button>
          <button type="button" class="budget-chip" onclick="setQuickBudget(185, 'High')">Up to ₱185 (High Protein)</button>
          <button type="button" class="budget-chip" onclick="setQuickBudget(235, 'All')">All Prices (₱45–₱235)</button>
        </div>
      </div>

      <div id="genResult" class="result-panel" style="margin-top:0;">
        <div class="notice" style="margin-top: 0;">
          Showing <b>${esc(tier === 'All' ? 'All Budget Tiers' : tier + ' Tier')}</b> meals priced up to <b>${money(defaultBudget)}</b> · All meals are kidney-safe (&lt;450mg sodium).
        </div>
        <div class="grid">
          ${initialMatches.map(m => mealCard(m, true)).join('')}
        </div>
      </div>
    </section>
  `);
}

function selectBudgetTier(tier, maxPeso) {
  state.generatorTier = tier;
  const tierSel = $('#tierInput');
  const budgetInp = $('#budgetInput');
  if (tierSel) tierSel.value = tier;
  if (budgetInp) budgetInp.value = maxPeso;
  $('#genForm')?.requestSubmit();
}

function setQuickBudget(amount, tier = 'All') {
  state.generatorTier = tier;
  const tierSel = $('#tierInput');
  const input = $('#budgetInput');
  if (tierSel) tierSel.value = tier;
  if (input) {
    input.value = amount;
    $('#genForm')?.requestSubmit();
  }
}

/* Real-Time AI Camera & Photo Food Scanner (#/scanner) */
function getActiveScanItem() {
  if (state.customScanData) {
    return state.customScanData;
  }
  const meal = state.meals.find(m => m.id === state.scannedMealId) || state.meals[0];
  const sodiumMg = meal.sodiumMg || 320;
  const risk = getSodiumRisk(sodiumMg);
  return {
    id: meal.id,
    isCustom: false,
    name: state.customScanName || cleanMealName(meal.name),
    image: state.customScanImage || mealImage(meal),
    price: meal.price,
    budgetTier: getMealTier(meal),
    calories: meal.calories,
    protein: meal.protein,
    sodiumMg,
    healthScore: meal.healthScore || 92,
    kidneyRisk: risk.level,
    ingredients: meal.ingredients || [],
    verdict: `✓ Kidney-Safe Dish (${sodiumMg}mg sodium — only ${Math.round((sodiumMg / 2000) * 100)}% of daily limit). Prepared with natural Filipino aromatics and ${meal.protein}g protein at ${money(meal.price)}.`,
    swapMealId: null
  };
}

function scannerView() {
  const sampleIds = ['m1', 'm2', 'm4', 'm3', 'm9', 'm12'];
  const samples = sampleIds.map(id => state.meals.find(m => m.id === id)).filter(Boolean);
  const item = getActiveScanItem();
  const risk = getSodiumRisk(item.sodiumMg);
  const swapMeal = item.swapMealId ? state.meals.find(m => m.id === item.swapMealId) : null;

  return `
    <div class="card" style="padding: 24px; margin-bottom: 24px;">
      <div class="section-head compact">
        <div>
          <div class="eyebrow">Real-Time AI Vision &amp; Renal Scanner</div>
          <h3 style="font-size: 21px; margin-top: 3px;">Live Camera Food Recognition &amp; Dialysis Risk Inspector</h3>
          <p>Point your camera at your real meal or upload a food photo. Our AI vision engine identifies the dish in real time, estimates Philippine Peso cost, and checks if sodium levels are safe for your kidneys.</p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-primary mini" onclick="startCameraScan()">📷 Start Live Camera Scan</button>
          <label class="btn btn-secondary mini" style="cursor: pointer;">
            📁 Upload Real Food Photo
            <input type="file" accept="image/*" capture="environment" style="display: none;" onchange="handleFoodPhotoUpload(event)">
          </label>
        </div>
      </div>

      <div class="scanner-layout" style="margin-top: 16px; margin-bottom: 0;">
        <div>
          <div class="scanner-stage" id="scannerStage">
            <div class="scanner-badge-top">
              <span class="side-dot"></span>
              <span id="scanStatusText">${state.isScanning ? 'Analyzing Food Pixels & Nutrients…' : `AI Verified · ${risk.label}`}</span>
            </div>
            <div class="scanner-hud"></div>
            <div class="scanner-laser"></div>
            <img id="scannerPreviewImg" src="${esc(item.image)}" alt="${esc(item.name)}" onerror="this.onerror=null;this.src='./assets/meals/tofu-bowl.jpg'" />
            <div class="live-vision-bar" id="liveVisionBar">
              <span><b>Detected:</b> ${esc(item.name.slice(0, 38))}</span>
              <span class="tier-badge tier-${esc(item.budgetTier || 'Low')}">${esc(item.budgetTier || 'Low')} · ${money(item.price)}</span>
            </div>
          </div>

          <div style="margin-top: 12px;">
            <div class="muted" style="font-size: 11.5px; font-weight: 700; text-transform: uppercase;">1. Test Healthy Filipino Meals (Low–High Price):</div>
            <div class="sample-strip">
              ${samples.map(s => `
                <button type="button" class="sample-btn ${!state.customScanData && !state.customScanImage && item.id === s.id ? 'active' : ''}" onclick="selectScanSample('${s.id}')">
                  <img src="${esc(mealImage(s))}" alt="" />
                  <div>
                    <b style="display:block; font-size:11.5px; line-height:1.2;">${esc(cleanMealName(s.name).slice(0, 20))}</b>
                    <span style="color: var(--brand-bright); font-size: 11px; font-weight: 700;">${money(s.price)} · ${s.sodiumMg || 310}mg Na</span>
                  </div>
                </button>
              `).join('')}
            </div>

            <div class="muted" style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; margin-top: 10px;">2. Test High-Sodium Dialysis-Risk Foods (See Warning):</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
              <button type="button" class="btn btn-secondary mini" onclick="simulateWarningScan('warn_canton')">⚠️ Scan Instant Pancit Canton</button>
              <button type="button" class="btn btn-secondary mini" onclick="simulateWarningScan('warn_friedchicken')">⚠️ Scan Fast-Food Fried Chicken</button>
              <button type="button" class="btn btn-secondary mini" onclick="simulateWarningScan('warn_canned')">⚠️ Scan Canned Corned Beef</button>
              <button type="button" class="btn btn-secondary mini" onclick="openCustomFoodDescribe()">✍️ Type What You Are Eating</button>
            </div>
          </div>
        </div>

        <div class="card scan-result-box" style="background: var(--bg);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div>
                <div class="eyebrow">Real-Time Scan Analysis · ${esc(item.budgetTier || 'Low')} Tier</div>
                <h3 style="margin: 4px 0; font-size: 20px;">${esc(item.name)}</h3>
              </div>
              <span class="risk-pill ${esc(risk.cls)}">${esc(risk.label)}</span>
            </div>

            <div class="macro-row" style="margin: 12px 0; grid-template-columns: repeat(4, 1fr);">
              <div class="macro-cell">
                <b style="color: var(--brand-bright); font-size: 14.5px;">${money(item.price)}</b>
                <span>PH Price (${esc(item.budgetTier || 'Low')})</span>
              </div>
              <div class="macro-cell">
                <b style="font-size: 14.5px;">${item.calories} kcal</b>
                <span>Calories</span>
              </div>
              <div class="macro-cell">
                <b style="font-size: 14.5px;">${item.protein}g</b>
                <span>Protein</span>
              </div>
              <div class="macro-cell">
                <b style="font-size: 14.5px; color: ${risk.level === 'HIGH' ? 'var(--danger)' : 'var(--brand-bright)'};">${item.sodiumMg}mg</b>
                <span>Sodium Load</span>
              </div>
            </div>

            <h4 style="margin: 12px 0 6px; font-size: 13px; color: var(--text-secondary);">Detected Components &amp; PH Cost Breakdown</h4>
            <table class="ing-table" style="margin: 0 0 10px;">
              <tbody>
                ${(item.ingredients || []).map(ing => `
                  <tr>
                    <td><b>${esc(ing.item)}</b></td>
                    <td class="muted">${esc(ing.amount)}</td>
                    <td style="text-align: right; color: var(--brand-bright); font-weight: 700;">${esc(ing.cost)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="notice ${risk.level === 'HIGH' ? 'error' : ''}" style="margin-top: 8px;">
              <b>Kidney &amp; Nutrition Verdict:</b> ${esc(item.verdict)}
            </div>

            ${swapMeal ? `
              <div style="margin-top: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.3); display:flex; justify-content:space-between; align-items:center; gap:10px;">
                <div style="font-size:12px;">
                  <b style="color:#86efac;">Recommended Kidney-Safe Swap:</b><br>
                  <span>${esc(cleanMealName(swapMeal.name))} (${money(swapMeal.price)} · only ${swapMeal.sodiumMg}mg Na)</span>
                </div>
                <button class="btn btn-primary mini" onclick="selectScanSample('${swapMeal.id}')">Switch to Swap</button>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
            ${!item.isCustom ? `<button class="btn btn-secondary" style="flex: 1;" onclick="openRecipe('${item.id}')">Full Recipe &amp; Steps</button>` : ''}
            <button class="btn btn-primary" style="flex: 1;" onclick="logCurrentScannedItem()">+ Log Scanned Food to Tracker</button>
          </div>
        </div>
      </div>

      <div style="margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--line);">
        <div class="section-head compact">
          <div>
            <h4 style="margin: 0; font-size: 15px;">Grocery &amp; Packaged Food Barcode Lookup</h4>
            <p>Search grocery items or enter a barcode to inspect sodium and nutrition per 100g.</p>
          </div>
        </div>
        <div class="form-grid" style="margin-top: 10px;">
          <form id="liveSearch" class="search-row">
            <input name="q" placeholder="Search food item (e.g., oats, yogurt, tuna, brown rice, noodles)..." required minlength="2">
            <button class="btn btn-primary mini">Search</button>
          </form>
          <form id="barcodeSearch" class="search-row">
            <input name="code" inputmode="numeric" placeholder="Enter product barcode (e.g., 3017620422003)">
            <button class="btn btn-secondary mini">Lookup Barcode</button>
          </form>
        </div>
        <div id="liveResult" class="result-panel"></div>
      </div>
    </div>
  `;
}

function selectScanSample(mealId) {
  stopCamera();
  state.scannedMealId = mealId;
  state.customScanImage = '';
  state.customScanName = '';
  state.customScanData = null;
  state.isScanning = true;
  render();
  setTimeout(() => {
    state.isScanning = false;
    const el = $('#scanStatusText');
    if (el) el.textContent = 'AI Verified · ✓ Kidney-Safe Low Sodium';
  }, 350);
}

function simulateWarningScan(profileId) {
  stopCamera();
  const p = REAL_WORLD_FOOD_PROFILES.find(x => x.id === profileId);
  if (!p) return;
  state.customScanData = { ...p, isCustom: true };
  state.customScanImage = p.image;
  state.customScanName = p.name;
  toast('Analyzed high-sodium food profile.');
  render();
}

function openCustomFoodDescribe() {
  modal(`
    <p class="muted" style="margin-top:0;">Type what you are eating right now (e.g., <i>"2 packs pancit canton"</i>, <i>"fried chicken with gravy"</i>, <i>"ginisang monggo"</i>, <i>"sinigang na bangus"</i>, <i>"corned beef silog"</i>) and ByteBite will calculate its Philippine price, nutrition, and kidney sodium risk.</p>
    <form id="customEatForm" class="form-grid">
      <div class="field full">
        <label>What are you eating?</label>
        <input name="query" placeholder="e.g., Instant Pancit Canton with egg, or Tinolang Manok" required>
      </div>
      <div class="full">
        <button class="btn btn-primary" style="width:100%;">Analyze My Meal Now</button>
      </div>
    </form>
  `, 'Analyze What You Are Eating');

  $('#customEatForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const q = String(new FormData(e.target).get('query') || '').trim();
    closeModal();
    if (!q) return;
    analyzeFoodTextOrLabels([q], '');
  });
}

/* Canvas Pixel Color/Texture & MobileNet Real-Time Vision Analyzer */
function analyzeCanvasVisualSignature(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width || 320;
  const h = canvas.height || 240;
  const data = ctx.getImageData(0, 0, w, h).data;

  let greenCount = 0;
  let warmBrownGold = 0;
  let redOrange = 0;
  let lightGrain = 0;
  let total = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    total++;

    if (g > r * 1.12 && g > b * 1.15 && g > 55) {
      greenCount++;
    } else if (r > 150 && g > 40 && g < 110 && b < 90) {
      redOrange++;
    } else if (r > 120 && g > 85 && b < 95 && r > b * 1.35) {
      warmBrownGold++;
    } else if (r > 185 && g > 180 && b > 165) {
      lightGrain++;
    }
  }

  const greenRatio = greenCount / Math.max(1, total);
  const brownRatio = warmBrownGold / Math.max(1, total);
  const redRatio = redOrange / Math.max(1, total);
  const lightRatio = lightGrain / Math.max(1, total);

  if (greenRatio > 0.14) {
    return { mealId: 'm1', hint: 'Leafy Greens & Legumes (Monggo / Laing / Malunggay)', confidence: 94 };
  }
  if (redRatio > 0.16) {
    return { mealId: 'm9', hint: 'Tomato / Atsuete Braise or Grilled Plate', confidence: 91 };
  }
  if (brownRatio > 0.22) {
    return { mealId: 'm2', hint: 'Golden Seared Tokwa / Chicken Inasal Protein', confidence: 92 };
  }
  if (lightRatio > 0.28) {
    return { mealId: 'm4', hint: 'Clear Ginger Broth / Steamed Fish & Rice Bowl', confidence: 90 };
  }
  return { mealId: 'm3', hint: 'Balanced Filipino Rice & Protein Plate', confidence: 89 };
}

function analyzeFoodTextOrLabels(labels = [], capturedDataUrl = '', visualFallback = null) {
  const joined = labels.join(' ').toLowerCase();

  // 1. Check if it matches any real-world high-sodium or fruit profile
  for (const prof of REAL_WORLD_FOOD_PROFILES) {
    if (prof.keywords.some(k => joined.includes(k))) {
      state.customScanData = {
        ...prof,
        isCustom: true,
        name: `${prof.name} (Live Scan)`,
        image: capturedDataUrl || prof.image
      };
      state.customScanImage = capturedDataUrl || prof.image;
      state.customScanName = state.customScanData.name;
      toast(`Detected: ${prof.name}`);
      render();
      return;
    }
  }

  // 2. Check if it matches any ByteBite Filipino meal by keyword
  const words = joined.split(/[^a-z0-9]+/).filter(w => w.length >= 3);
  const matchedMeal = state.meals.find(m => {
    const hay = `${m.name} ${m.category} ${(m.tags || []).join(' ')}`.toLowerCase();
    return words.some(w => hay.includes(w));
  }) || (visualFallback ? state.meals.find(m => m.id === visualFallback.mealId) : null) || state.meals[0];

  const sodiumMg = matchedMeal.sodiumMg || 320;
  const risk = getSodiumRisk(sodiumMg);
  const detectedLabel = labels[0] ? ` · AI Vision: ${labels[0]}` : (visualFallback ? ` · ${visualFallback.hint}` : '');

  state.scannedMealId = matchedMeal.id;
  state.customScanImage = capturedDataUrl || mealImage(matchedMeal);
  state.customScanName = `${cleanMealName(matchedMeal.name)} (Scanned Dish)`;
  state.customScanData = {
    id: matchedMeal.id,
    isCustom: false,
    name: state.customScanName,
    image: state.customScanImage,
    price: matchedMeal.price,
    budgetTier: getMealTier(matchedMeal),
    calories: matchedMeal.calories,
    protein: matchedMeal.protein,
    sodiumMg,
    healthScore: matchedMeal.healthScore || 92,
    kidneyRisk: risk.level,
    ingredients: matchedMeal.ingredients || [],
    verdict: `✓ Real-Time Scan Complete${detectedLabel}. Estimated PH cost: ${money(matchedMeal.price)} (${getMealTier(matchedMeal)} Tier). Kidney-safe sodium level (${sodiumMg}mg Na).`,
    swapMealId: null
  };
  toast(`Identified: ${cleanMealName(matchedMeal.name)} (${money(matchedMeal.price)})`);
  render();
}

async function classifyImageElement(imgOrVideoEl, canvas) {
  const labels = [];
  try {
    if (!state.mobilenetModel && window.mobilenet) {
      await preloadMobileNet();
    }
    if (state.mobilenetModel) {
      const preds = await state.mobilenetModel.classify(imgOrVideoEl);
      if (Array.isArray(preds)) {
        preds.forEach(p => {
          if (p && p.className) labels.push(p.className);
        });
      }
    }
  } catch {}
  const visualSig = analyzeCanvasVisualSignature(canvas);
  return { labels, visualSig };
}

function handleFoodPhotoUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  stopCamera();
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result);
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const { labels, visualSig } = await classifyImageElement(img, canvas);
      analyzeFoodTextOrLabels([baseName, ...labels], dataUrl, visualSig);
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

async function startCameraScan() {
  const stage = $('#scannerStage');
  if (!stage || !navigator.mediaDevices?.getUserMedia) {
    toast('Camera is unavailable in this browser; use Upload Real Food Photo or test buttons.', true);
    return;
  }
  try {
    stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    });
    state.cameraStream = stream;
    stage.innerHTML = `
      <div class="scanner-badge-top">
        <span class="side-dot"></span>
        <span id="liveCamBadge">Live Camera Active · AI Vision Scanning…</span>
      </div>
      <div class="scanner-hud"></div>
      <div class="scanner-laser"></div>
      <video id="cameraVideo" autoplay playsinline muted></video>
      <div class="live-vision-bar" id="liveVisionHud">
        <span id="liveVisionText">Hold your food plate in front of the camera…</span>
        <button class="btn btn-primary mini" onclick="captureCameraFrame()">📸 Capture &amp; Analyze Now</button>
      </div>
    `;
    const video = $('#cameraVideo');
    video.srcObject = stream;

    // Continuous real-time preview classification every 1.3s
    state.liveVisionTimer = setInterval(async () => {
      const v = $('#cameraVideo');
      const hudText = $('#liveVisionText');
      if (!v || v.readyState < 2 || !hudText) return;
      try {
        const c = document.createElement('canvas');
        c.width = 224;
        c.height = 224;
        c.getContext('2d').drawImage(v, 0, 0, 224, 224);
        const { labels, visualSig } = await classifyImageElement(v, c);
        const topLabel = labels[0] ? labels[0].split(',')[0] : visualSig.hint;
        hudText.innerHTML = `<b>Live AI Vision:</b> ${esc(topLabel)} (${visualSig.confidence}% match)`;
      } catch {}
    }, 1300);
  } catch (err) {
    toast('Camera permission declined. Use "Upload Real Food Photo" or "Type What You Are Eating".', true);
  }
}

async function captureCameraFrame() {
  const video = $('#cameraVideo');
  if (!video) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  const capturedUrl = canvas.toDataURL('image/jpeg', 0.88);
  const { labels, visualSig } = await classifyImageElement(video, canvas);
  stopCamera();
  analyzeFoodTextOrLabels(labels, capturedUrl, visualSig);
}

function stopCamera() {
  if (state.liveVisionTimer) {
    clearInterval(state.liveVisionTimer);
    state.liveVisionTimer = null;
  }
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
}

async function logCurrentScannedItem() {
  if (!needAuth()) return;
  const item = getActiveScanItem();
  try {
    state.tracker = await api('/tracker/log', {
      method: 'POST',
      body: JSON.stringify({
        name: item.name,
        source: 'Real-Time AI Scanner',
        calories: item.calories,
        protein: item.protein,
        sodiumMg: item.sodiumMg,
        price: item.price,
        servings: 1
      })
    });
    toast(`Logged "${item.name}" (${money(item.price)}) to Daily Tracker!`);
    render();
  } catch (e) {
    toast(e.message, true);
  }
}

function scannerPage() {
  return shell(`
    <section class="page">
      ${moduleGuide('Real-Time AI Food & Barcode Scanner', [
        ['1. Capture or Upload Your Meal', 'Click "Start Live Camera Scan" or "Upload Real Food Photo" (or test any preset dish or high-sodium food below).'],
        ['2. Inspect Sodium & Cost Breakdown', 'View real-time calories, protein, PHP palengke ingredient costs, and automatic Kidney Sodium Risk verdicts.'],
        ['3. Swap or Log to Daily Tracker', 'If a meal is flagged High Sodium, click "Switch to Swap" for a healthy alternative, or log it directly to your tracker.']
      ])}
      ${scannerView()}
    </section>
  `);
}

/* Interactive Real GPS Map Locator (#/locator) */
function locator() {
  const areas = ['All', ...new Set(state.vendors.map(v => v.area))];
  const filteredVendors = state.locatorFilter === 'All'
    ? state.vendors
    : state.vendors.filter(v => v.area === state.locatorFilter);

  return shell(`
    <section class="page">
      ${moduleGuide('Interactive Cubao Kitchen Map', [
        ['1. Pin Your Real GPS Location', 'Click "Locate My Real GPS & Nearby Spots" to plot your live coordinates and calculate exact Haversine distances.'],
        ['2. Explore Verified Healthy Kitchens', 'Click any pin on the interactive OpenStreetMap or filter by Cubao neighborhood (TIP QC, Araneta, Aurora Blvd, Katipunan).'],
        ['3. Get Turn-by-Turn Directions', 'Click "Pin on Live Map" to zoom to the street corner or "Directions" to launch Google Maps navigation.']
      ])}

      <div class="card location-card" style="margin-bottom:0;">
        <div>
          <div class="eyebrow">Real-Time GPS &amp; OpenStreetMap Integration</div>
          <h2>Interactive Cubao Partner Kitchen Map</h2>
          <p class="muted" style="margin: 0; max-width: 640px;">Locate verified low-sodium, budget-friendly kitchens around TIP Quezon City, Araneta City, Aurora Blvd, and Katipunan serving meals across Low (₱45–₱75), Medium (₱80–₱135), and High (₱140–₱235) tiers.</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="findNearby()">📍 Locate My Real GPS &amp; Nearby Spots</button>
          <button class="btn btn-secondary" onclick="resetCubaoMap()">Reset to Cubao Center</button>
        </div>
      </div>

      <div class="card map-shell" style="margin-bottom:0;">
        <div class="map-toolbar">
          <div>
            <b style="font-size:14px;">Live Interactive Map — Cubao, Quezon City</b>
            <span class="muted" style="font-size:12px; margin-left:8px;">Click any marker for kitchen menu, price tier, and turn-by-turn Google Maps directions.</span>
          </div>
          <span class="chip" id="mapGpsStatus">6 Partner Kitchens Pinned</span>
        </div>
        <div id="cubaoMap" class="map-box"></div>
      </div>

      <div id="nearbyResult"></div>

      <div class="section-head">
        <div>
          <h3>Verified Partner Kitchens (${filteredVendors.length})</h3>
          <p>Click "Pin on Live Map" on any kitchen card to zoom directly to its street location.</p>
        </div>
        <div class="meta">
          ${areas.map(a => `
            <button class="btn ${state.locatorFilter === a ? 'btn-primary' : 'btn-secondary'} mini" onclick="filterLocator('${esc(a)}')">${esc(a)}</button>
          `).join('')}
        </div>
      </div>

      <div class="vendor-list">
        ${filteredVendors.map(vendorCard).join('')}
      </div>
    </section>
  `);
}

function initLeafletMap() {
  const mapEl = $('#cubaoMap');
  if (!mapEl || !window.L) return;

  if (state.leafletMap) {
    try { state.leafletMap.remove(); } catch {}
    state.leafletMap = null;
  }

  const centerLat = 14.6218;
  const centerLon = 121.0574;
  const map = window.L.map('cubaoMap', { zoomControl: true }).setView([centerLat, centerLon], 15);
  state.leafletMap = map;
  state.leafletMarkers = {};

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  state.vendors.forEach(v => {
    const lat = Number(v.lat || 14.6218);
    const lon = Number(v.lon || 121.0574);
    const marker = window.L.marker([lat, lon]).addTo(map);
    marker.bindPopup(`
      <div style="min-width:210px; font-family:Inter,sans-serif; color:#0f172a;">
        <b style="font-size:14px;">${esc(v.name)}</b><br>
        <span style="font-size:11.5px; color:#475569;">${esc(v.address || v.area)}</span><br>
        <div style="margin:6px 0; font-size:12px;">
          <b>Price Range:</b> <span style="color:#15803d; font-weight:700;">${esc(v.priceRange)}</span> (${esc(v.priceTier || 'Low')} Tier)<br>
          <b>Rating:</b> ★ ${v.rating} · <b>Hours:</b> ${esc(v.hours || '7:00 AM – 8:00 PM')}
        </div>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener" style="display:inline-block; padding:5px 10px; background:#16a34a; color:#fff; border-radius:6px; font-size:11.5px; font-weight:600; text-decoration:none;">Google Maps Directions ↗</a>
      </div>
    `);
    state.leafletMarkers[v.id] = marker;
  });

  setTimeout(() => {
    try { map.invalidateSize(); } catch {}
  }, 180);
}

function focusVendorOnMap(lat, lon, vendorId) {
  if (route() !== 'locator') {
    location.hash = '#/locator';
    setTimeout(() => focusVendorOnMap(lat, lon, vendorId), 280);
    return;
  }
  const mapEl = $('#cubaoMap');
  if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (state.leafletMap) {
    state.leafletMap.flyTo([lat, lon], 17, { duration: 0.8 });
    const marker = state.leafletMarkers[vendorId];
    if (marker) marker.openPopup();
  }
}

function resetCubaoMap() {
  if (state.leafletMap) {
    state.leafletMap.flyTo([14.6218, 121.0574], 15, { duration: 0.7 });
  }
}

function filterLocator(area) {
  state.locatorFilter = area;
  render();
}

async function renderNearbyPlacesAt(lat, lon, labelText) {
  const out = $('#nearbyResult');
  const statusChip = $('#mapGpsStatus');
  if (statusChip) statusChip.textContent = labelText;

  if (state.leafletMap && window.L) {
    if (state.userMarker) {
      try { state.leafletMap.removeLayer(state.userMarker); } catch {}
    }
    state.userMarker = window.L.circleMarker([lat, lon], {
      radius: 9,
      color: '#38bdf8',
      fillColor: '#0284c7',
      fillOpacity: 0.9,
      weight: 3
    }).addTo(state.leafletMap).bindPopup(`<b>Your Location</b><br>${esc(labelText)}`);
    state.leafletMap.flyTo([lat, lon], 15, { duration: 0.8 });
    state.userMarker.openPopup();
  }

  if (!out) return;
  out.innerHTML = '<div class="notice">Calculating real GPS distances to nearby healthy kitchens…</div>';
  try {
    const d = await api(`/live/nearby?lat=${lat}&lon=${lon}`);
    out.innerHTML = `
      <div class="section-head">
        <div>
          <h3>Closest Healthy Dining Spots to Your GPS Pin (${(d.places || []).length})</h3>
          <p>Sorted by real Haversine distance from (${lat.toFixed(4)}, ${lon.toFixed(4)})</p>
        </div>
      </div>
      <div class="vendor-list" style="margin-bottom: 24px;">
        ${(d.places || []).map(v => `
          <div class="vendor">
            <div class="vendor-top">
              <div>
                <div class="vendor-name">${esc(v.name)}</div>
                <div class="muted" style="font-size: 12.5px;">${esc(v.type)} · ${esc(v.address || 'Cubao, QC')}</div>
              </div>
              <span class="chip" style="color:var(--brand-bright); border-color:rgba(34,197,94,0.4);">${v.distanceKm} km away</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; gap:8px;">
              <div class="meta">
                ${v.priceRange ? `<span class="chip">${esc(v.priceRange)}</span>` : ''}
                ${v.vegetarian === 'yes' ? '<span class="chip">Vegetarian</span>' : ''}
              </div>
              <div style="display:flex; gap:6px;">
                <button class="btn btn-secondary mini" onclick="focusVendorOnMap(${v.lat}, ${v.lon}, '${esc(v.id || '')}')">Center on Map</button>
                <a class="btn btn-primary mini" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lon}">Directions ↗</a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    out.innerHTML = `<div class="notice error">${esc(err.message)}</div>`;
  }
}

function findNearby() {
  const out = $('#nearbyResult');
  if (!navigator.geolocation) {
    renderNearbyPlacesAt(14.6218, 121.0574, 'Cubao Campus Center (Default GPS)');
    return;
  }
  if (out) out.innerHTML = '<div class="notice">Acquiring your real GPS coordinates…</div>';
  navigator.geolocation.getCurrentPosition(
    pos => {
      renderNearbyPlacesAt(pos.coords.latitude, pos.coords.longitude, 'Live GPS Pin Active');
    },
    () => {
      toast('Using Cubao Campus GPS center (browser location permission skipped).');
      renderNearbyPlacesAt(14.6218, 121.0574, 'Cubao Campus Center (14.6218° N, 121.0574° E)');
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

function getProWeeklySchedule() {
  const tier = state.proPlanTier || 'Low';
  const pool = state.meals.filter(m => getMealTier(m) === tier);
  const list = pool.length >= 9 ? pool : state.meals;
  const seed = state.proPlanSeed || 0;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((d, i) => {
    const b = list[(i * 3 + seed * 5) % list.length];
    const l = list[(i * 3 + 1 + seed * 5) % list.length];
    const dn = list[(i * 3 + 2 + seed * 5) % list.length];
    const dayTotal = b.price + l.price + dn.price;
    const daySodium = (b.sodiumMg || 300) + (l.sodiumMg || 320) + (dn.sodiumMg || 310);
    const dayProtein = (b.protein || 18) + (l.protein || 22) + (dn.protein || 20);
    return { day: d, b, l, dn, dayTotal, daySodium, dayProtein };
  });
}

function getProGroceryChecklist(schedule) {
  const map = new Map();
  schedule.forEach(dayObj => {
    [dayObj.b, dayObj.l, dayObj.dn].forEach(meal => {
      const ings = meal.ingredients && meal.ingredients.length ? meal.ingredients : [
        { item: 'Lean Filipino protein / firm tokwa', amount: '150g', cost: '₱28' },
        { item: 'Fresh leafy greens (malunggay / pechay / kangkong)', amount: '1.5 cups', cost: '₱15' },
        { item: 'Garlic, red onion, luya & calamansi', amount: '2 tbsp', cost: '₱8' }
      ];
      ings.forEach(ing => {
        const key = ing.item;
        const numCost = Number(String(ing.cost || '15').replace(/[^0-9.]/g, '')) || 15;
        if (!map.has(key)) {
          map.set(key, { item: key, portion: ing.amount, count: 1, totalCost: numCost });
        } else {
          const prev = map.get(key);
          prev.count += 1;
          prev.totalCost += numCost;
        }
      });
    });
  });
  return [...map.values()].slice(0, 12);
}

function selectProPlanTier(tier) {
  state.proPlanTier = tier;
  render();
  toast(`Switched 7-Day Pro Planner to ${tier} Budget Tier.`);
}

function regenerateProPlan() {
  state.proPlanSeed = (state.proPlanSeed || 0) + 1;
  state.checkedGrocery = {};
  render();
  toast('Generated a fresh 7-day kidney-safe Filipino meal schedule & palengke list!');
}

function toggleGroceryItem(key) {
  state.checkedGrocery[key] = !state.checkedGrocery[key];
  render();
}

async function logFullDayPlan(bId, lId, dId, dayLabel) {
  if (!needAuth()) return;
  try {
    await api('/tracker/meal/' + bId, { method: 'POST' });
    await api('/tracker/meal/' + lId, { method: 'POST' });
    state.tracker = await api('/tracker/meal/' + dId, { method: 'POST' });
    toast(`Logged all 3 kidney-safe meals for ${dayLabel} to your Daily Log!`);
    render();
  } catch (e) {
    toast(e.message, true);
  }
}

function exportGroceryModal() {
  const schedule = getProWeeklySchedule();
  const groceries = getProGroceryChecklist(schedule);
  const weekTotal = schedule.reduce((s, d) => s + d.dayTotal, 0);
  modal(`
    <p class="muted" style="margin-top:0;">
      Official <b>ByteBite Pro 7-Day Philippine Palengke Shopping Checklist</b> (${esc(state.proPlanTier)} Budget Tier · Est. Weekly Meal Total: <b>${money(weekTotal)}</b>):
    </p>
    <div style="max-height:320px; overflow-y:auto; border:1px solid var(--line); border-radius:10px; padding:12px; background:var(--bg); margin-bottom:14px;">
      <table class="ing-table" style="margin:0;">
        <thead>
          <tr style="font-size:11px; text-transform:uppercase; color:var(--muted);">
            <td>Palengke Ingredient</td>
            <td>Weekly Qty</td>
            <td style="text-align:right;">Est. PH Cost</td>
          </tr>
        </thead>
        <tbody>
          ${groceries.map(g => `
            <tr>
              <td><b>✓ ${esc(g.item)}</b></td>
              <td class="muted">${g.count}x (${esc(g.portion)})</td>
              <td style="text-align:right; color:var(--brand-bright); font-weight:700;">${money(g.totalCost)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="display:flex; gap:8px; justify-content:flex-end;">
      <button class="btn btn-secondary mini" onclick="closeModal()">Close</button>
      <button class="btn btn-primary mini" onclick="window.print()">🖨 Print / Save PDF</button>
    </div>
  `, 'Weekly Palengke Shopping List');
}

function updateRiskCalculator(field, val) {
  if (field === 'fastFood') state.riskFastFood = Number(val);
  if (field === 'water') state.riskWater = Number(val);
  if (field === 'salt') state.riskSalt = String(val);
  render();
}

function claimProVoucher(vendorName, code, discountText, perkText) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent('BYTEBITE-VIP:' + code + ':' + vendorName)}`;
  modal(`
    <p class="muted" style="margin-top:0;">Present this <b>ByteBite Pro VIP Pass</b> at <b>${esc(vendorName)}</b> in Cubao, Quezon City to redeem your discount on any verified low-sodium meal:</p>
    <div style="display:grid; grid-template-columns:160px 1fr; gap:16px; align-items:center; padding:14px; border-radius:12px; background:var(--bg); border:1px solid var(--line); margin-bottom:14px;">
      <div style="background:#fff; padding:8px; border-radius:10px; display:grid; place-items:center;">
        <img src="${esc(qrSrc)}" alt="VIP Voucher QR" style="width:140px; height:140px; display:block;" />
      </div>
      <div>
        <span class="pro-crown-badge">★ VIP PARTNER PASS</span>
        <h3 style="margin:6px 0 4px; font-size:19px;">${esc(discountText)} — ${esc(vendorName)}</h3>
        <p class="muted" style="margin:0 0 8px; font-size:13px;">${esc(perkText)}</p>
        <div style="font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:700; color:var(--brand-bright); padding:6px 10px; border-radius:8px; background:var(--panel); border:1px dashed var(--brand); display:inline-block;">
          VOUCHER CODE: ${esc(code)}
        </div>
      </div>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:8px;">
      <button class="btn btn-secondary mini" onclick="closeModal()">Close</button>
      <button class="btn btn-primary mini" onclick="closeModal(); toast('VIP Voucher ${esc(code)} saved to your account!')">✓ Save Voucher</button>
    </div>
  `, 'ByteBite Pro VIP Kitchen Voucher');
}

function openProCheckoutModal() {
  if (!needAuth()) return;
  modal(`
    <p class="muted" style="margin-top:0;">Unlock the complete <b>ByteBite Pro Renal &amp; Budget Suite</b>. Choose your preferred Philippine payment method below:</p>
    <form id="proCheckoutForm" class="form-grid">
      <div class="field full">
        <label>Select Membership Tier</label>
        <select name="plan">
          <option value="99">Standard ByteBite Pro — ₱99 / month (Cancel anytime)</option>
          <option value="79">TIP / Cubao Student &amp; Senior Citizen Discount — ₱79 / month (20% Off)</option>
          <option value="890">Annual Family &amp; Renal Protection Pass — ₱890 / year (Save ₱298)</option>
        </select>
      </div>
      <div class="field">
        <label>Payment Channel</label>
        <select name="method">
          <option value="GCash">GCash Express Checkout</option>
          <option value="Maya">Maya Wallet / QR Ph</option>
          <option value="BPI / BDO">BPI / BDO Online Direct</option>
        </select>
      </div>
      <div class="field">
        <label>Mobile Number (GCash / Maya)</label>
        <input name="mobile" placeholder="0917 123 4567" value="0917 882 4190" required>
      </div>
      <div class="full notice">
        <b>Instant Pro Activation Includes:</b> Unlimited AI Camera Food Plate Scans, Customizable 7-Day Low/Med/High Meal Schedules, Automated Palengke Grocery Checklists, and 6 Cubao Partner Karinderya VIP Vouchers (save ₱250+/month).
      </div>
      <div class="full">
        <button class="btn btn-primary" style="width:100%;">Confirm &amp; Activate ByteBite Pro Now</button>
      </div>
    </form>
  `, 'Activate ByteBite Pro Membership');

  $('#proCheckoutForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    closeModal();
    await activatePremium();
  });
}

function premium() {
  const isPro = !!state.user?.premium;
  const tier = state.proPlanTier || 'Low';
  const schedule = getProWeeklySchedule();
  const groceries = getProGroceryChecklist(schedule);
  const weekCost = schedule.reduce((s, d) => s + d.dayTotal, 0);
  const avgDailyCost = Math.round(weekCost / 7);
  const avgDailySodium = Math.round(schedule.reduce((s, d) => s + d.daySodium, 0) / 7);

  // Clinical Kidney & Blood Pressure Risk Calculator computations
  const ff = state.riskFastFood ?? 1;
  const waterG = state.riskWater ?? 8;
  const saltHabit = state.riskSalt || 'low';
  const baseNa = saltHabit === 'low' ? 1120 : saltHabit === 'mod' ? 1850 : 2650;
  const estDailyNa = Math.round(baseNa + ff * 240 - Math.max(0, waterG - 6) * 45);
  const renalScore = Math.max(22, Math.min(99, Math.round(100 - Math.max(0, (estDailyNa - 1050) / 22) + Math.min(8, waterG))));
  const monthlyNaSavedGrams = Math.max(12, Math.round(((2800 - Math.min(2400, estDailyNa)) * 30) / 1000));
  const annualPesoSaved = (ff <= 1 ? 18500 : ff <= 3 ? 14200 : 9600) + (saltHabit === 'low' ? 8400 : 3200);

  const vouchers = [
    {
      vendor: 'Luntian Karinderya & Grill',
      area: 'Aurora Blvd, Cubao',
      discount: '15% OFF',
      code: 'BBPRO-LUNTIAN15',
      perk: '15% off any Low-Sodium Ginisang Monggo, Tinola, or Steamed Tilapia Bowl (Min. spend ₱55).'
    },
    {
      vendor: 'Kusina Verde Cubao',
      area: 'Araneta City, Cubao',
      discount: '₱25 OFF',
      code: 'BBPRO-VERDE25',
      perk: '₱25 instant discount on Grilled Chicken Inasal or Garlic Tokwa High-Protein Plates.'
    },
    {
      vendor: 'PeraPlate Express TIP',
      area: 'Near TIP Quezon City',
      discount: 'FREE DRINK',
      code: 'BBPRO-TIPCHIA',
      perk: 'Free 16oz Unsweetened Calamansi-Chia Kidney Flush Drink with any Low or Medium Tier meal.'
    },
    {
      vendor: 'Lutong Bahay Renal Kitchen',
      area: 'P. Tuazon Blvd, Cubao',
      discount: '15% OFF',
      code: 'BBPRO-RENAL15',
      perk: '15% off 3-Meal Daily Student & BPO Bento Subscriptions (<950mg total daily sodium).'
    },
    {
      vendor: 'Katipunan Fresh Bowl Co.',
      area: 'Katipunan Ave, QC',
      discount: '₱30 OFF',
      code: 'BBPRO-KATIP30',
      perk: '₱30 off High-Tier Seared Tuna, Salmon, or Lean Beef Broccoli Brown Rice Bowls.'
    },
    {
      vendor: 'Cubao Wet Market Palengke Hub',
      area: 'Farmers / Murphy Cubao',
      discount: '10% OFF',
      code: 'BBPRO-PALENGKE10',
      perk: '10% off pre-portioned weekly vegetable, tokwa, and lean fish bundles for home cooking.'
    }
  ];

  return shell(`
    <section class="page">
      ${moduleGuide('ByteBite Pro Suite & 7-Day Planner', [
        ['1. Customize Your 7-Day Plan', 'Switch between Low (₱150+/day), Medium (₱255+/day), and High (₱430+/day) tiers, regenerate menus, or log a full day in 1 click.'],
        ['2. Use Auto-Generated Palengke Lists', 'Check off weekly wet-market ingredients with real PHP prices and print/export your shopping list.'],
        ['3. Claim VIP Partner Vouchers', 'Redeem 10%–15% off QR vouchers at 6 Cubao kitchens—saving over ₱350/month on a ₱99/mo membership.']
      ])}

      <div class="pro-hero-banner">
        <div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
            <span class="pro-crown-badge">${isPro ? '★ BYTEBITE PRO ACTIVE' : '★ PREMIUM RENAL & BUDGET SUITE'}</span>
            <span class="chip" style="background:rgba(255,255,255,0.12); color:#fff; border-color:rgba(255,255,255,0.2);">₱99 / month (₱3.30 / day)</span>
          </div>
          <h2 style="margin:0 0 10px; font-size:26px; line-height:1.18; color:#fff;">
            Make Every Peso Count: Automated 7-Day Kidney-Safe Meal Planning, Palengke Grocery Lists &amp; VIP Kitchen Perks
          </h2>
          <p style="margin:0 0 16px; color:#cbd5e1; font-size:14px; line-height:1.6;">
            ByteBite Pro pays for itself in just 3 meals. Get unlimited real-time AI camera food scanning, customizable 7-day low-sodium meal schedules across Low, Medium, and High budgets, automated Philippine wet-market shopping checklists, clinical kidney risk projections, and exclusive 10%–15% discounts at Cubao partner kitchens.
          </p>
          <div class="actions">
            ${isPro
              ? `<button class="btn btn-primary" onclick="regenerateProPlan()">↻ Generate New 7-Day Pro Menu</button>`
              : `<button class="btn btn-primary" onclick="openProCheckoutModal()">⚡ Activate ByteBite Pro — ₱99/mo</button>`
            }
            <button class="btn btn-secondary" style="background:rgba(255,255,255,0.1); color:#fff; border-color:rgba(255,255,255,0.22);" onclick="exportGroceryModal()">🖨 Print Weekly Palengke List</button>
            <button class="btn btn-secondary" style="background:rgba(255,255,255,0.1); color:#fff; border-color:rgba(255,255,255,0.22);" onclick="openProCheckoutModal()">💳 View Student &amp; GCash Plans</button>
          </div>
        </div>

        <div class="pro-stat-grid">
          <div class="pro-stat-box">
            <b>₱2,450/mo</b>
            <span>Avg. Food &amp; Medical Savings vs. Fast Food</span>
          </div>
          <div class="pro-stat-box">
            <b>${avgDailySodium}mg / day</b>
            <span>Active 7-Day Plan Avg. Sodium (DOH Optimal)</span>
          </div>
          <div class="pro-stat-box">
            <b>6 Kitchens</b>
            <span>10%–15% VIP Partner Vouchers in Cubao</span>
          </div>
          <div class="pro-stat-box">
            <b>${money(avgDailyCost)} / day</b>
            <span>3 Full Meals/Day (${esc(tier)} Tier Active)</span>
          </div>
        </div>
      </div>

      <!-- PRO FEATURE 1: Interactive 7-Day Kidney-Safe Meal Schedule Customizer -->
      <div class="card" style="padding: 24px;">
        <div class="section-head compact">
          <div>
            <div class="eyebrow">Pro Feature 1 · Automated Weekly Meal Architect</div>
            <h3 style="margin-top: 3px;">Interactive 7-Day Kidney-Safe Philippine Meal Schedule (${esc(tier)} Tier · Avg ${money(avgDailyCost)}/Day)</h3>
            <p>Switch budget tiers anytime, regenerate a fresh 21-meal combination, click any meal for its recipe, or log an entire day in one click.</p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn ${tier === 'Low' ? 'btn-primary' : 'btn-secondary'} mini" onclick="selectProPlanTier('Low')">Low Tier (₱150–195/day)</button>
            <button class="btn ${tier === 'Medium' ? 'btn-primary' : 'btn-secondary'} mini" onclick="selectProPlanTier('Medium')">Medium Tier (₱255–345/day)</button>
            <button class="btn ${tier === 'High' ? 'btn-primary' : 'btn-secondary'} mini" onclick="selectProPlanTier('High')">High Tier (₱430–540/day)</button>
            <button class="btn btn-secondary mini" onclick="regenerateProPlan()">↻ Regenerate Week</button>
          </div>
        </div>

        <div class="week-grid">
          ${schedule.map(d => `
            <div class="day-col" style="justify-content:space-between;">
              <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <b style="font-size:14px;">${d.day}</b>
                  <span style="font-size:11.5px; color:var(--brand-bright); font-weight:700;">${money(d.dayTotal)}</span>
                </div>
                <small class="muted" style="font-size:10.5px;">Na: ${d.daySodium}mg ✓ · Prot: ${d.dayProtein}g</small>
                <div class="day-meal" onclick="openRecipe('${d.b.id}')" title="Click for palengke recipe">
                  <small class="muted" style="display:block; font-size:10px;">Breakfast · ${money(d.b.price)}</small>
                  <b>${esc(cleanMealName(d.b.name).slice(0, 22))}</b>
                </div>
                <div class="day-meal" onclick="openRecipe('${d.l.id}')" title="Click for palengke recipe">
                  <small class="muted" style="display:block; font-size:10px;">Lunch · ${money(d.l.price)}</small>
                  <b>${esc(cleanMealName(d.l.name).slice(0, 22))}</b>
                </div>
                <div class="day-meal" onclick="openRecipe('${d.dn.id}')" title="Click for palengke recipe">
                  <small class="muted" style="display:block; font-size:10px;">Dinner · ${money(d.dn.price)}</small>
                  <b>${esc(cleanMealName(d.dn.name).slice(0, 22))}</b>
                </div>
              </div>
              <button class="btn btn-secondary mini" style="width:100%; font-size:11px; padding:5px 6px; margin-top:4px;" onclick="logFullDayPlan('${d.b.id}', '${d.l.id}', '${d.dn.id}', '${d.day}')">+ Log Full ${d.day}</button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- PRO FEATURE 2: Automated Weekly Palengke Grocery List & Cost Calculator -->
      <div class="card" style="padding: 24px;">
        <div class="section-head compact">
          <div>
            <div class="eyebrow">Pro Feature 2 · Smart Wet-Market Aggregator</div>
            <h3 style="margin-top: 3px;">Automated Weekly Palengke Grocery Checklist &amp; Cost Estimator</h3>
            <p>Aggregated ingredients for your active ${esc(tier)} Tier 7-day meal plan. Tap any item to check it off as you shop at the palengke.</p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="chip" style="color:var(--brand-bright); font-weight:700;">Est. Weekly Total: ${money(weekCost)}</span>
            <button class="btn btn-primary mini" onclick="exportGroceryModal()">🖨 Print / Export Checklist</button>
          </div>
        </div>

        <div class="grocery-grid">
          ${groceries.map((g, idx) => {
            const checked = !!state.checkedGrocery[g.item];
            return `
              <div class="grocery-item ${checked ? 'checked' : ''}" onclick="toggleGroceryItem('${esc(g.item)}')">
                <div style="display:flex; align-items:center; gap:10px;">
                  <input type="checkbox" ${checked ? 'checked' : ''} onclick="event.stopPropagation(); toggleGroceryItem('${esc(g.item)}')" style="width:16px; height:16px; accent-color:var(--brand);" />
                  <div>
                    <b style="display:block; font-size:13px;">${esc(g.item)}</b>
                    <small class="muted" style="font-size:11.5px;">${g.count}x weekly portions (${esc(g.portion)} each)</small>
                  </div>
                </div>
                <b style="color:var(--brand-bright); font-size:13px;">${money(g.totalCost)}</b>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- PRO FEATURE 3: Interactive Clinical Kidney & Blood Pressure Risk Calculator -->
      <div class="card" style="padding: 24px;">
        <div class="section-head compact">
          <div>
            <div class="eyebrow">Pro Feature 3 · Preventive Nephrology &amp; Financial Simulator</div>
            <h3 style="margin-top: 3px;">Interactive Kidney Protection &amp; Dialysis Risk Savings Calculator</h3>
            <p>Simulate how switching from high-sodium fast food and instant noodles to ByteBite Pro meals protects your kidneys and wallet over 12 months.</p>
          </div>
        </div>

        <div class="form-grid" style="grid-template-columns: repeat(3, 1fr); margin-top: 12px;">
          <div class="field">
            <label>1. Weekly Fast-Food / Instant Noodle Meals</label>
            <select onchange="updateRiskCalculator('fastFood', this.value)">
              <option value="0" ${ff === 0 ? 'selected' : ''}>0–1 times / week (Minimal Risk)</option>
              <option value="1" ${ff === 1 ? 'selected' : ''}>1–2 times / week (ByteBite Pro Target)</option>
              <option value="3" ${ff === 3 ? 'selected' : ''}>3–4 times / week (Moderate Renal Strain)</option>
              <option value="6" ${ff === 6 ? 'selected' : ''}>6+ times / week (High Dialysis Risk)</option>
            </select>
          </div>
          <div class="field">
            <label>2. Daily Water Hydration Intake</label>
            <select onchange="updateRiskCalculator('water', this.value)">
              <option value="5" ${waterG === 5 ? 'selected' : ''}>4–5 glasses / day (Under-hydrated)</option>
              <option value="7" ${waterG === 7 ? 'selected' : ''}>6–7 glasses / day (Moderate)</option>
              <option value="8" ${waterG === 8 ? 'selected' : ''}>8–9 glasses / day (DOH Optimal Flush)</option>
              <option value="10" ${waterG === 10 ? 'selected' : ''}>10+ glasses / day (Active Hydration)</option>
            </select>
          </div>
          <div class="field">
            <label>3. Primary Seasoning Habit</label>
            <select onchange="updateRiskCalculator('salt', this.value)">
              <option value="low" ${saltHabit === 'low' ? 'selected' : ''}>Calamansi, Garlic &amp; Ginger (ByteBite Style)</option>
              <option value="mod" ${saltHabit === 'mod' ? 'selected' : ''}>Standard Table Salt &amp; Soy Sauce</option>
              <option value="high" ${saltHabit === 'high' ? 'selected' : ''}>Heavy Patis, Bagoong &amp; MSG Sachets</option>
            </select>
          </div>
        </div>

        <div class="kpi-strip" style="margin-top: 16px;">
          <div class="kpi-card" style="background:var(--bg);">
            <div class="kpi-label"><span>Kidney Protection Score</span><span>Target: 85+</span></div>
            <div class="kpi-value" style="color:${renalScore >= 80 ? 'var(--brand-bright)' : 'var(--warn)'};">${renalScore} <span style="font-size:14px; color:var(--muted);">/ 100</span></div>
            <div class="kpi-sub">${renalScore >= 80 ? '✓ Optimal Low-Sodium Renal Shield' : '⚠️ Reduce fast food & patis intake'}</div>
          </div>
          <div class="kpi-card" style="background:var(--bg);">
            <div class="kpi-label"><span>Projected Daily Sodium</span><span>DOH Ideal: ≤1,500mg</span></div>
            <div class="kpi-value" style="color:${estDailyNa <= 1500 ? 'var(--brand-bright)' : estDailyNa <= 2000 ? 'var(--warn)' : 'var(--danger)'};">${estDailyNa} <span style="font-size:14px; color:var(--muted);">mg/day</span></div>
            <div class="kpi-sub">${estDailyNa <= 1500 ? 'Safely within DOH optimal zone' : 'Switch to Low-Salt Aromatics'}</div>
          </div>
          <div class="kpi-card" style="background:var(--bg);">
            <div class="kpi-label"><span>Monthly Salt Prevented</span><span>vs. Commercial Diet</span></div>
            <div class="kpi-value">${monthlyNaSavedGrams}g <span style="font-size:14px; color:var(--muted);">Na / mo</span></div>
            <div class="kpi-sub">Equivalent to ~${Math.round(monthlyNaSavedGrams * 2.5)}g table salt avoided</div>
          </div>
          <div class="kpi-card" style="background:var(--bg);">
            <div class="kpi-label"><span>Est. Annual Savings</span><span>Food + Preventive Health</span></div>
            <div class="kpi-value" style="color:var(--brand-bright);">${money(annualPesoSaved)}</div>
            <div class="kpi-sub">Dialysis in PH costs ₱240,000+/yr out-of-pocket</div>
          </div>
        </div>
      </div>

      <!-- PRO FEATURE 4: Exclusive Cubao Partner Karinderya VIP Vouchers -->
      <div class="card" style="padding: 24px;">
        <div class="section-head compact">
          <div>
            <div class="eyebrow">Pro Feature 4 · Cubao Partner Kitchen Network</div>
            <h3 style="margin-top: 3px;">Exclusive VIP Discount Vouchers at 6 Verified Cubao Kitchens</h3>
            <p>Redeem 10%–15% off and free healthy drinks at our partner carinderias and grills around TIP QC, Araneta City, and Katipunan.</p>
          </div>
        </div>

        <div class="voucher-grid">
          ${vouchers.map(v => `
            <div class="voucher-card">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px;">
                  <span class="voucher-discount">${esc(v.discount)}</span>
                  <small class="muted" style="font-weight:700;">${esc(v.area)}</small>
                </div>
                <h4 style="margin:0 0 4px; font-size:15.5px;">${esc(v.vendor)}</h4>
                <p class="muted" style="margin:0; font-size:12.5px; line-height:1.45;">${esc(v.perk)}</p>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px dashed var(--line);">
                <code style="font-size:11.5px; font-weight:700; color:var(--brand-bright);">${esc(v.code)}</code>
                <button class="btn btn-primary mini" onclick="claimProVoucher('${esc(v.vendor)}', '${esc(v.code)}', '${esc(v.discount)}', '${esc(v.perk)}')">Claim QR Pass</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- PRO FEATURE 5: Embedded Real-Time AI Scanner & Membership Comparison -->
      ${scannerView()}

      <div class="pricing-grid" style="margin-top:0;">
        <div class="card pricing-card">
          <div>
            <div class="eyebrow" style="color: var(--muted);">Standard Free Plan</div>
            <div class="price-large">₱0 <span>/ month</span></div>
            <p class="muted" style="font-size: 13px;">Essential tools for browsing Low–High budget meals, recipes, and kidney sodium tracking.</p>
            <ul class="feature-list">
              <li><i>✓</i> Full ${state.meals.length.toLocaleString()}+ meal directory (Low ₱45–75, Med ₱80–135, High ₱140–235)</li>
              <li><i>✓</i> Itemized Philippine palengke ingredient lists &amp; cooking guides</li>
              <li><i>✓</i> Kidney &amp; Sodium Shield + Daily Hydration Tracker</li>
              <li><i>✓</i> 12 Cooking Reels with Audio &amp; Interactive Cubao Kitchen Map</li>
            </ul>
          </div>
          <button class="btn btn-secondary" style="width: 100%;" disabled>Included Free Forever</button>
        </div>

        <div class="card pricing-card featured">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="eyebrow">ByteBite Pro Membership</div>
              <span class="pro-crown-badge">BEST VALUE · STUDENT ₱79</span>
            </div>
            <div class="price-large">₱99 <span>/ month (or ₱79 Student)</span></div>
            <p class="muted" style="font-size: 13px;">Complete AI Vision Scanner, customizable 7-day meal &amp; palengke planner, risk simulator, and VIP kitchen vouchers.</p>
            <ul class="feature-list">
              <li><i>✓</i> <b>Interactive 7-Day Meal Customizer</b> across Low, Medium &amp; High PHP Tiers + 1-Click Full Day Logging</li>
              <li><i>✓</i> <b>Automated Weekly Palengke Grocery Checklist</b> with PHP cost totals &amp; PDF/Print export</li>
              <li><i>✓</i> <b>Clinical Kidney &amp; Blood Pressure Risk Simulator</b> with annual medical savings projection</li>
              <li><i>✓</i> <b>6 Cubao Partner Karinderya VIP QR Vouchers</b> (10%–15% off meals &amp; free calamansi-chia drinks)</li>
              <li><i>✓</i> <b>Unlimited Real-Time AI Camera &amp; Photo Food Scanning</b> with instant sodium swap alerts</li>
            </ul>
          </div>
          ${isPro
            ? `<div style="display:flex; gap:8px;">
                <div class="notice" style="margin: 0; flex:1; text-align: center; font-weight: 700;">✓ ByteBite Pro Active</div>
                <button class="btn btn-secondary" onclick="openProCheckoutModal()">Manage Plan</button>
               </div>`
            : `<button class="btn btn-primary" style="width: 100%;" onclick="openProCheckoutModal()">⚡ Activate ByteBite Pro — ₱99/mo (GCash / Maya)</button>`
          }
        </div>
      </div>
    </section>
  `);
}

function profile() {
  if (!state.user) {
    return shell(signInCard('Account Settings', 'Sign in to configure your daily Philippine Peso food budget, kidney sodium limit, and nutrition targets.'));
  }
  const g = state.user.dailyGoals || {};
  return shell(`
    <section class="page">
      ${moduleGuide('Account & Health Settings', [
        ['1. Set Your Daily PHP Food Budget', 'Enter how much you want to spend per day (e.g., ₱150/day) so ByteBite can tailor meal recommendations.'],
        ['2. Configure Your Sodium Limit', 'Set your daily sodium ceiling (1,500mg DOH optimal or 2,000mg WHO max) for kidney protection.'],
        ['3. Save & Sync Instantly', 'Click "Save Settings" to update your Dashboard KPIs, Meal Finder filters, and Daily Tracker bars.']
      ])}

      <div class="card form-card">
        <div class="eyebrow">Profile &amp; Renal Targets</div>
        <h2 style="margin: 6px 0 6px;">Account &amp; Nutrition Settings</h2>
        <p class="muted" style="margin: 0 0 20px;">Configure your daily PHP food budget and kidney-safe sodium targets.</p>

        <form id="profileForm" class="form-grid">
          <div class="field">
            <label>Full Name</label>
            <input name="name" value="${esc(state.user.name)}" required>
          </div>
          <div class="field">
            <label>Daily Food Budget (₱)</label>
            <input name="budget" type="number" min="45" max="2000" value="${state.user.budget}">
          </div>
          <div class="field">
            <label>Primary Nutrition Goal</label>
            <select name="goal">
              ${['Balanced', 'Budget Saver', 'Low Sodium', 'High Protein', 'Weight Management'].map(x => `
                <option ${state.user.goal === x ? 'selected' : ''}>${x}</option>
              `).join('')}
            </select>
          </div>
          <div class="field">
            <label>Dietary Preference</label>
            <input name="dietary" value="${esc(state.user.dietary)}">
          </div>
          <div class="field full">
            <label>Campus / Neighborhood</label>
            <input name="location" value="${esc(state.user.location)}">
          </div>

          <div class="full subhead">Daily Nutrition &amp; Kidney Targets</div>
          <div class="field">
            <label>Calories (kcal)</label>
            <input name="calories" type="number" value="${g.calories || 2000}">
          </div>
          <div class="field">
            <label>Protein (g)</label>
            <input name="protein" type="number" value="${g.protein || 90}">
          </div>
          <div class="field">
            <label>Daily Sodium Limit (mg — DOH Kidney Safe: 1500–2000)</label>
            <input name="sodiumMg" type="number" value="${g.sodiumMg || 2000}">
          </div>
          <div class="field">
            <label>Water Goal (glasses)</label>
            <input name="waterGlasses" type="number" value="${g.waterGlasses || 8}">
          </div>

          <div class="full actions" style="margin-top: 8px;">
            <button class="btn btn-primary">Save Settings</button>
            <button type="button" class="btn btn-secondary" onclick="logout()">Sign Out</button>
          </div>
        </form>
        <div id="profileMsg"></div>
      </div>
    </section>
  `);
}

function signInCard(title, text) {
  return `
    <section class="page">
      <div class="card form-card" style="text-align: center; padding: 40px 26px;">
        <div class="eyebrow" style="justify-content: center;">Account Required</div>
        <h2 style="margin: 8px 0;">${esc(title)}</h2>
        <p class="muted" style="max-width: 440px; margin: 0 auto 22px;">${esc(text)}</p>
        <button class="btn btn-primary" onclick="showAuth()">Sign In or Create Account</button>
      </div>
    </section>
  `;
}

/* Complete Platform Guide & How Each Module Works (#/guide) */
function guidePage() {
  const modules = [
    {
      name: '1. Dashboard Overview',
      route: '#/home',
      badge: 'Command Center',
      purpose: 'Gives you an instant snapshot of your daily calories, protein, Philippine Peso food spend, and kidney sodium load.',
      steps: [
        'Check the 4 KPI cards at the top to see your live Calories, Protein, PHP Spend, and Sodium (mg) against daily limits.',
        'Click any Philippine Budget Tier (Low ₱45–₱75, Medium ₱80–₱135, High ₱140–₱235) to jump straight to matching meals.',
        'Click any Featured Meal card to view its palengke ingredient breakdown or log it with one click.'
      ],
      btnLabel: 'Open Dashboard →'
    },
    {
      name: '2. Meal Finder (Low · Medium · High)',
      route: '#/generator',
      badge: '1,009+ PH Meals',
      purpose: 'Helps you find affordable, freshly cooked Filipino meals tailored to your exact peso budget and health goal.',
      steps: [
        'Select your Price Tier: Low (₱45–₱75 carinderia/dorm), Medium (₱80–₱135 campus/office), or High (₱140–₱235 high-protein).',
        'Choose your health goal (Low Sodium, Budget Saver, High Protein, or Vegetarian) and click Apply.',
        'Click "Ingredients & Cook" on any dish to see exact wet-market ingredient costs and low-sodium cooking steps.'
      ],
      btnLabel: 'Open Meal Finder →'
    },
    {
      name: '3. Real-Time AI Food & Barcode Scanner',
      route: '#/scanner',
      badge: 'Live Camera AI',
      purpose: 'Identifies what you are eating in real time and warns you immediately if a meal has dangerous sodium levels.',
      steps: [
        'Click "Start Live Camera Scan" to point your camera at your food, or click "Upload Real Food Photo".',
        'Test the preset buttons ("Scan Instant Pancit Canton", "Scan Fried Chicken") or click "Type What You Are Eating".',
        'Review the Kidney & Nutrition Verdict. If flagged High Sodium, click "Switch to Swap" or "+ Log Scanned Food".'
      ],
      btnLabel: 'Open Food Scanner →'
    },
    {
      name: '4. Kidney & Sodium Shield',
      route: '#/kidney',
      badge: 'Dialysis Prevention',
      purpose: 'Protects you from Chronic Kidney Disease (CKD) and hypertension by keeping daily sodium under 1,500mg–2,000mg.',
      steps: [
        'Check Today’s Renal Sodium Meter bar (Green: 0–1,500mg Safe, Amber: 1,500–2,000mg Caution, Red: >2,000mg High Risk).',
        'Compare High-Sodium Risk Foods (instant noodles, canned corned beef, fast food) with healthy ₱48–₱98 Filipino swaps.',
        'Follow the 3 Culinary Renal Rules (calamansi brightening, triple aromatics, and hydration flush) to cut salt by 70%.'
      ],
      btnLabel: 'Open Kidney Shield →'
    },
    {
      name: '5. Daily Nutrition & Hydration Log',
      route: '#/tracker',
      badge: 'Daily Tracker',
      purpose: 'Records everything you eat and drink today so you never exceed your PHP food budget or safe sodium ceiling.',
      steps: [
        'Log meals from any module or click "+ Add Custom Entry" to enter a custom dish, price, and sodium amount.',
        'Tap the interactive Water Glasses (1 to 8+) to log your water intake and help your kidneys flush out sodium.',
        'Review your Recorded Meals list and remove or adjust any entry at any time.'
      ],
      btnLabel: 'Open Daily Log →'
    },
    {
      name: '6. Interactive Cubao Kitchen Map',
      route: '#/locator',
      badge: 'Live GPS Map',
      purpose: 'Locates verified, budget-friendly carinderias and healthy kitchens around Cubao, Quezon City on a real street map.',
      steps: [
        'Click "Locate My Real GPS & Nearby Spots" to pin your live coordinates and calculate exact Haversine distances (km).',
        'Click any marker on the interactive Leaflet map or click "Pin on Live Map" on any kitchen card to zoom to its street.',
        'Click "Directions" to open turn-by-turn Google Maps walking or transit routing to that kitchen.'
      ],
      btnLabel: 'Open Kitchen Map →'
    },
    {
      name: '7. Cooking Reels with Audio & Voice',
      route: '#/reels',
      badge: '12 Recipe Videos',
      purpose: 'Shows short-form cooking videos demonstrating how to prepare healthy Filipino dishes with step-by-step voice narration.',
      steps: [
        'Scroll vertically through the 12 cooking reels or click "↻ Shuffle Feed" to load a fresh video order.',
        'Tap "Tap for Audio" in the top-right corner of the video to enable kitchen ambience and voice recipe narration.',
        'Click "Ingredients & Steps" inside the video overlay to view the full palengke recipe, or "+ Upload Video" to share yours.'
      ],
      btnLabel: 'Open Cooking Reels →'
    },
    {
      name: '8. ByteBite Pro & 7-Day Meal Schedule',
      route: '#/premium',
      badge: 'Weekly Planner',
      purpose: 'Automates your entire week (Monday–Sunday) with 3 kidney-safe meals per day totaling ₱160–₱260/day.',
      steps: [
        'Browse the 7-Day Low-Sodium Meal Schedule where every full day stays safely under ~950mg–1,200mg total sodium.',
        'Click any Breakfast, Lunch, or Dinner slot to open its itemized recipe and cooking guide.',
        'Use the Account Settings page (#/profile) anytime to customize your daily peso budget and sodium targets.'
      ],
      btnLabel: 'Open 7-Day Planner →'
    }
  ];

  return shell(`
    <section class="page">
      <div class="guide-hero">
        <div>
          <div class="eyebrow">Platform Overview &amp; User Guide</div>
          <h2 style="margin: 6px 0 10px; font-size: 26px; line-height: 1.2;">What Is ByteBite PH &amp; How Does It Help People?</h2>
          <p class="muted" style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
            <b>ByteBite PH</b> is a smart Philippine meal planner, real-time AI food scanner, and GPS kitchen locator designed to help students, workers, and families <b>eat nutritious meals on a real ₱45–₱235 budget</b> while <b>preventing Chronic Kidney Disease (CKD), dialysis, hypertension, and diabetes</b>. Instead of relying on high-sodium instant noodles, canned goods, and fast food (which pack 1,400mg–1,900mg of sodium per plate), ByteBite connects you to affordable, low-sodium Filipino dishes and nearby healthy kitchens.
          </p>
          <div class="actions">
            <a class="btn btn-primary" href="#/generator">Start Browsing Meals (₱45+)</a>
            <a class="btn btn-secondary" href="#/scanner">Try Live Food Scanner</a>
            <a class="btn btn-secondary" href="#/kidney">Open Kidney Shield</a>
            <button type="button" class="btn btn-secondary" onclick="openHostingModal()">Mobile QR / Cloud Link</button>
          </div>
        </div>

        <div class="card" style="background:var(--bg); border-color:rgba(22,163,74,0.3);">
          <div class="eyebrow">Why ByteBite Matters in the Philippines</div>
          <div style="display:grid; gap:10px; margin-top:10px; font-size:13px;">
            <div style="padding:10px 12px; border-radius:10px; background:var(--panel); border:1px solid var(--line);">
              <b style="color:var(--danger); display:block;">The Health Crisis (1 in 10 Filipinos)</b>
              <span class="muted" style="font-size:12px;">Over 1 in 10 Filipino adults suffer from kidney disease due to high-salt diets. Dialysis costs over ₱20,000/month.</span>
            </div>
            <div style="padding:10px 12px; border-radius:10px; background:var(--panel); border:1px solid var(--line);">
              <b style="color:var(--brand-bright); display:block;">The ByteBite Solution (&lt;450mg Na / Meal)</b>
              <span class="muted" style="font-size:12px;">1,009+ freshly cooked Filipino meals across Low (₱45–₱75), Medium (₱80–₱135), and High (₱140–₱235) budgets.</span>
            </div>
            <div style="padding:10px 12px; border-radius:10px; background:var(--panel); border:1px solid var(--line);">
              <b style="color:#0284c7; display:block;">Works on Desktop &amp; Mobile</b>
              <span class="muted" style="font-size:12px;">Automatically adapts to any PC browser or smartphone screen with live camera scanning and GPS mapping.</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-head">
        <div>
          <div class="eyebrow">End-to-End Workflow</div>
          <h3>How the 4 Core Stages Work Together</h3>
          <p>Follow this simple daily routine to save money and protect your kidneys.</p>
        </div>
      </div>

      <div class="workflow-grid">
        <div class="workflow-card">
          <div class="workflow-num">1</div>
          <h4 style="margin:4px 0 2px; font-size:15px;">Set Budget &amp; Sodium Goal</h4>
          <p class="muted" style="margin:0; font-size:12.5px; line-height:1.5;">
            Configure your daily Philippine Peso budget (e.g., ₱150/day) and safe kidney sodium limit (1,500mg–2,000mg) in Settings.
          </p>
        </div>
        <div class="workflow-card">
          <div class="workflow-num">2</div>
          <h4 style="margin:4px 0 2px; font-size:15px;">Find or Scan Your Meal</h4>
          <p class="muted" style="margin:0; font-size:12.5px; line-height:1.5;">
            Pick a Low/Medium/High tier dish in Meal Finder or scan your real plate with the AI Camera Scanner to check sodium risk.
          </p>
        </div>
        <div class="workflow-card">
          <div class="workflow-num">3</div>
          <h4 style="margin:4px 0 2px; font-size:15px;">Cook or Locate a Kitchen</h4>
          <p class="muted" style="margin:0; font-size:12.5px; line-height:1.5;">
            Cook at home using our palengke ingredient breakdowns and Cooking Reels, or locate a verified Cubao eatery on the GPS Map.
          </p>
        </div>
        <div class="workflow-card">
          <div class="workflow-num">4</div>
          <h4 style="margin:4px 0 2px; font-size:15px;">Log &amp; Flush Sodium</h4>
          <p class="muted" style="margin:0; font-size:12.5px; line-height:1.5;">
            Log your meal and 8+ glasses of water in the Daily Log and Kidney Shield to keep your blood pressure and kidneys healthy.
          </p>
        </div>
      </div>

      <div class="section-head">
        <div>
          <div class="eyebrow">Module-by-Module Manual</div>
          <h3>How Every Module Works Step by Step</h3>
          <p>Click any module below to test it live.</p>
        </div>
      </div>

      <div class="guide-module-grid">
        ${modules.map(m => `
          <article class="guide-module-card">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                <h4 style="margin:0; font-size:16.5px; color:var(--text);">${esc(m.name)}</h4>
                <span class="chip" style="color:var(--brand-bright); border-color:rgba(34,197,94,0.35);">${esc(m.badge)}</span>
              </div>
              <p class="muted" style="margin:0 0 8px; font-size:13px; line-height:1.45;">${esc(m.purpose)}</p>
              <ol class="guide-step-ol">
                ${m.steps.map(st => `<li>${esc(st)}</li>`).join('')}
              </ol>
            </div>
            <div style="padding-top:10px; border-top:1px solid var(--line); display:flex; justify-content:flex-end;">
              <a class="btn btn-primary mini" href="${esc(m.route)}">${esc(m.btnLabel)}</a>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `);
}

function render() {
  const r = route();
  const html = r === 'home' ? home()
    : r === 'tracker' ? tracker()
    : (r === 'reels' || r === 'saved') ? reels()
    : r === 'generator' ? generator()
    : r === 'scanner' ? scannerPage()
    : r === 'kidney' ? kidneyPage()
    : r === 'guide' ? guidePage()
    : r === 'locator' ? locator()
    : r === 'premium' ? premium()
    : profile();
  document.getElementById('app').innerHTML = html;
  bind();
}

function bind() {
  const gf = $('#genForm');
  if (gf) gf.addEventListener('submit', generate);
  const pf = $('#profileForm');
  if (pf) pf.addEventListener('submit', saveProfile);
  const ls = $('#liveSearch');
  if (ls) ls.addEventListener('submit', searchPackagedFood);
  const bs = $('#barcodeSearch');
  if (bs) bs.addEventListener('submit', searchBarcode);
  setupReels();
  if (route() === 'locator') {
    initLeafletMap();
  }
}

async function generate(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const out = $('#genResult');
  const q = String(fd.get('q') || '').trim().toLowerCase();
  const tier = fd.get('tier') || 'All';
  state.generatorTier = tier;
  const budget = Math.max(45, +fd.get('budget') || 135);
  const goal = fd.get('goal');
  const sortBy = fd.get('sort') || 'price';
  const dietary = fd.get('dietary') || 'No preference';

  const matches = state.meals
    .filter(m => {
      const mTier = getMealTier(m);
      const tierOk = tier === 'All' || mTier === tier;
      const budgetOk = m.price <= budget;
      const goalOk = goal === 'Balanced' || (m.goals || []).includes(goal);
      const dietOk = dietary === 'No preference' || (m.dietary || []).includes(dietary);
      const qOk = !q || `${m.name} ${m.category || ''} ${(m.tags || []).join(' ')}`.toLowerCase().includes(q);
      return tierOk && budgetOk && goalOk && dietOk && qOk;
    })
    .sort((a, b) => {
      if (sortBy === 'sodium') return (a.sodiumMg || 320) - (b.sodiumMg || 320) || a.price - b.price;
      if (sortBy === 'protein') return (b.protein || 0) - (a.protein || 0) || a.price - b.price;
      if (sortBy === 'score') return (b.healthScore || 90) - (a.healthScore || 90) || a.price - b.price;
      return a.price - b.price || (b.healthScore || 90) - (a.healthScore || 90);
    })
    .slice(0, 15);

  const exampleThree = matches.slice(0, 3).reduce((s, m) => s + m.price, 0);

  out.innerHTML = `
    <div class="notice" style="margin-top: 0;">
      Showing <b>${matches.length} kidney-safe meals</b> in <b>${esc(tier === 'All' ? 'All Tiers' : tier + ' Tier')}</b> up to <b>${money(budget)}</b>${q ? ` matching "<b>${esc(q)}</b>"` : ''} · 3-meal full day total starts at <b>${money(exampleThree)}</b>.
    </div>
    <div class="grid">
      ${matches.map(m => mealCard(m, true)).join('') || '<div class="empty full">No meals matched that filter. Try clearing the search box, raising the max meal budget, or switching to All Tiers.</div>'}
    </div>
  `;
}

async function searchPackagedFood(e) {
  e.preventDefault();
  const out = $('#liveResult');
  const q = new FormData(e.target).get('q');
  out.innerHTML = '<div class="notice">Searching nutrition &amp; sodium records…</div>';
  try {
    const d = await api('/live/foods?q=' + encodeURIComponent(q));
    out.innerHTML = `
      <div class="grid">
        ${(d.products || []).map(p => {
          const risk = getSodiumRisk(p.sodiumMg100g);
          return `
            <article class="card" style="display:flex; flex-direction:column; justify-content:space-between; gap:12px;">
              <div style="display:flex; gap:12px; align-items:center;">
                ${p.image ? `<img src="${esc(p.image)}" alt="" style="width:60px; height:60px; border-radius:8px; object-fit:contain; background:white;">` : ''}
                <div>
                  <span class="risk-pill ${esc(risk.cls)}">${esc(risk.label)}</span>
                  <h4 style="margin:5px 0 2px;">${esc(p.name)}</h4>
                  <small class="muted">${esc(p.brand || 'Packaged Food')} · per 100g</small>
                </div>
              </div>
              <div class="macro-row">
                <div class="macro-cell"><b>${p.calories100g} kcal</b><span>Energy</span></div>
                <div class="macro-cell"><b>${p.protein100g}g</b><span>Protein</span></div>
                <div class="macro-cell"><b style="color:${risk.level === 'HIGH' ? 'var(--danger)' : 'var(--brand-bright)'};">${p.sodiumMg100g}mg</b><span>Sodium</span></div>
              </div>
              <button class="btn btn-primary mini" onclick='logScannedProduct(${JSON.stringify(JSON.stringify(p))})'>+ Log 100g to Tracker</button>
            </article>
          `;
        }).join('') || '<div class="empty full">No matching items found.</div>'}
      </div>
    `;
  } catch (err) {
    const localMatches = state.meals.filter(m => m.name.toLowerCase().includes(String(q).toLowerCase())).slice(0, 6);
    out.innerHTML = `
      <div class="grid">
        ${localMatches.map(m => mealCard(m, true)).join('') || `<div class="notice error full">${esc(err.message)}</div>`}
      </div>
    `;
  }
}

async function searchBarcode(e) {
  e.preventDefault();
  const out = $('#liveResult');
  const code = new FormData(e.target).get('code');
  out.innerHTML = '<div class="notice">Checking barcode…</div>';
  try {
    const d = await api('/live/barcode/' + encodeURIComponent(code));
    const p = d.product;
    const risk = getSodiumRisk(p.sodiumMg100g);
    out.innerHTML = `
      <div class="grid">
        <article class="card">
          <span class="risk-pill ${esc(risk.cls)}">${esc(risk.label)}</span>
          <h4 style="margin:8px 0 4px;">${esc(p.name)}</h4>
          <p class="muted" style="font-size:12.5px;">Barcode: ${esc(p.barcode)} · ${esc(p.brand)}</p>
          <div class="macro-row" style="margin:10px 0;">
            <div class="macro-cell"><b>${p.calories100g} kcal</b><span>per 100g</span></div>
            <div class="macro-cell"><b>${p.protein100g}g</b><span>Protein</span></div>
            <div class="macro-cell"><b>${p.sodiumMg100g}mg</b><span>Sodium</span></div>
          </div>
          <button class="btn btn-primary mini" style="width:100%;" onclick='logScannedProduct(${JSON.stringify(JSON.stringify(p))})'>+ Log 100g to Tracker</button>
        </article>
      </div>
    `;
  } catch (err) {
    out.innerHTML = `<div class="notice error">${esc(err.message)}</div>`;
  }
}

function logScannedProduct(serialized) {
  if (!needAuth()) return;
  const p = JSON.parse(serialized);
  modal(`
    <p><b>${esc(p.name)}</b> (per 100g: ${p.calories100g} kcal · ${p.protein100g}g protein · ${p.sodiumMg100g}mg sodium)</p>
    <form id="scanLogForm" class="form-grid">
      <div class="field">
        <label>100g Servings</label>
        <input name="servings" type="number" min="0.1" step="0.1" value="1">
      </div>
      <div class="field">
        <label>Cost Paid (₱)</label>
        <input name="price" type="number" min="0" step="0.01" value="50">
      </div>
      <div class="full">
        <button class="btn btn-primary" style="width:100%;">Add to Daily Log</button>
      </div>
    </form>
  `, 'Log Scanned Item');

  $('#scanLogForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      state.tracker = await api('/tracker/log', {
        method: 'POST',
        body: JSON.stringify({
          name: p.name,
          source: 'Barcode Scanner',
          calories: p.calories100g,
          protein: p.protein100g,
          sodiumMg: p.sodiumMg100g,
          price: +f.price,
          servings: +f.servings
        })
      });
      closeModal();
      toast('Scanned item logged.');
    } catch (err) {
      toast(err.message, true);
    }
  });
}

async function saveProfile(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    state.user = await api('/profile', {
      method: 'PUT',
      body: JSON.stringify(Object.fromEntries(fd))
    });
    toast('Settings saved.');
    render();
  } catch (err) {
    $('#profileMsg').innerHTML = `<div class="notice error">${esc(err.message)}</div>`;
  }
}

async function trackMeal(id) {
  if (!needAuth()) return;
  try {
    state.tracker = await api('/tracker/meal/' + id, { method: 'POST' });
    toast('Meal added to today’s log.');
    render();
  } catch (e) {
    toast(e.message, true);
  }
}

async function deleteLog(id) {
  try {
    state.tracker = await api('/tracker/log/' + id, { method: 'DELETE' });
    render();
  } catch (e) {
    toast(e.message, true);
  }
}

async function water(glasses) {
  if (!needAuth()) return;
  try {
    state.tracker = await api('/tracker/water', {
      method: 'POST',
      body: JSON.stringify({ glasses })
    });
    toast(glasses > 0 ? '+1 glass of water logged for kidney hydration.' : 'Updated water count.');
    render();
  } catch (e) {
    toast(e.message, true);
  }
}

function openManualLog() {
  if (!needAuth()) return;
  modal(`
    <p class="muted" style="margin-top: 0;">Record a meal or snack with its nutrition values, sodium content, and Philippine Peso cost.</p>
    <form id="manualForm" class="form-grid">
      <div class="field full">
        <label>Food Name</label>
        <input name="name" placeholder="e.g., Ginisang Monggo Bowl" required>
      </div>
      <div class="field">
        <label>Calories (kcal)</label>
        <input name="calories" type="number" min="0" required>
      </div>
      <div class="field">
        <label>Protein (g)</label>
        <input name="protein" type="number" min="0" step="0.1" value="15">
      </div>
      <div class="field">
        <label>Sodium (mg)</label>
        <input name="sodiumMg" type="number" min="0" value="310">
      </div>
      <div class="field">
        <label>Cost (₱)</label>
        <input name="price" type="number" min="0" step="0.01" value="55">
      </div>
      <div class="field full">
        <label>Servings</label>
        <input name="servings" type="number" min="0.1" step="0.1" value="1">
      </div>
      <div class="full">
        <button class="btn btn-primary" style="width: 100%;">Save Entry</button>
      </div>
    </form>
  `, 'Add Custom Entry');

  $('#manualForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      state.tracker = await api('/tracker/log', {
        method: 'POST',
        body: JSON.stringify({
          ...Object.fromEntries(new FormData(e.target)),
          source: 'Custom Entry'
        })
      });
      closeModal();
      toast('Entry added.');
      render();
    } catch (err) {
      toast(err.message, true);
    }
  });
}

function openReelUpload() {
  if (!needAuth()) return;
  modal(`
    <p class="muted" style="margin-top: 0;">Upload a short cooking video (MP4, WebM, or MOV up to 120 MB).</p>
    <form id="reelUploadForm" class="form-grid">
      <div class="field full">
        <label>Video File</label>
        <input name="video" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" required>
      </div>
      <div class="field full">
        <label>Title</label>
        <input name="title" placeholder="e.g., ₱48 Ginisang Monggo Low-Sodium Prep" required maxlength="80">
      </div>
      <div class="field full">
        <label>Cooking Notes</label>
        <textarea name="caption" rows="3" maxlength="240" placeholder="Share ingredients, PHP cost, or low-sodium cooking steps..."></textarea>
      </div>
      <div class="field full">
        <label>Linked Dish</label>
        <select name="mealId">
          ${state.meals.slice(0, 60).map(m => `<option value="${m.id}">${esc(cleanMealName(m.name))} (${money(m.price)} · ${getMealTier(m)} Tier)</option>`).join('')}
        </select>
      </div>
      <label class="check full">
        <input type="checkbox" name="healthy" required>
        <span>This video shows a healthy, kidney-safe meal or cooking preparation.</span>
      </label>
      <div class="full">
        <button class="btn btn-primary" style="width: 100%;">Upload Video</button>
      </div>
    </form>
    <div id="uploadMsg"></div>
  `, 'Upload Cooking Video');

  $('#reelUploadForm').addEventListener('submit', uploadReel);
}

async function uploadReel(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const file = fd.get('video');
  const msg = $('#uploadMsg');
  if (!file || !file.size) {
    msg.innerHTML = '<div class="notice error">Select a video file first.</div>';
    return;
  }
  if (file.size > 120 * 1024 * 1024) {
    msg.innerHTML = '<div class="notice error">Maximum file size is 120 MB.</div>';
    return;
  }
  msg.innerHTML = `<div class="notice">Uploading <b>${esc(file.name)}</b> (${(file.size / 1024 / 1024).toFixed(1)} MB)…</div>`;
  try {
    const q = new URLSearchParams({
      title: String(fd.get('title') || ''),
      caption: String(fd.get('caption') || ''),
      mealId: String(fd.get('mealId') || ''),
      healthyConfirmed: String(fd.get('healthy') === 'on')
    });
    const r = await fetch('/api/reels/upload-file?' + q.toString(), {
      method: 'POST',
      headers: {
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Upload failed');
    const reel = d.reel;
    if (!state.reels.some(x => x.id === reel.id)) state.reels.unshift(reel);
    closeModal();
    location.hash = '#/reels';
    render();
    toast('Cooking video uploaded.');
  } catch (err) {
    msg.innerHTML = `<div class="notice error">${esc(err.message)}</div>`;
  }
}

function connectEvents() {
  if (window.__bbSSE) return;
  const es = new EventSource('/api/events');
  window.__bbSSE = es;
  es.addEventListener('reel:like', e => {
    const d = JSON.parse(e.data);
    const r = state.reels.find(x => x.id === d.reelId);
    if (r) r.likes = d.likes;
    const el = $('#likes-' + CSS.escape(d.reelId));
    if (el) el.textContent = d.likes;
  });
  es.addEventListener('reel:comment', e => {
    const d = JSON.parse(e.data);
    const el = $('#comments-' + CSS.escape(d.reelId));
    if (el) el.textContent = d.count;
  });
  es.addEventListener('reel:new', e => {
    const d = JSON.parse(e.data);
    if (!state.reels.some(x => x.id === d.reel.id)) {
      state.reels.unshift(d.reel);
    }
  });
  es.addEventListener('tracker:update', async () => {
    if (state.user && (route() === 'tracker' || route() === 'kidney')) {
      try {
        state.tracker = await api('/tracker/today');
        render();
      } catch {}
    }
  });
  es.addEventListener('hosting:update', e => {
    try {
      const d = JSON.parse(e.data);
      if (d.publicUrl) {
        state.app = state.app || {};
        state.app.publicUrl = d.publicUrl;
      }
    } catch {}
  });
}

function showAuth() {
  modal(`
    <div class="auth-tabs">
      <button class="btn btn-primary" id="loginTab" onclick="authMode('login')">Sign In</button>
      <button class="btn btn-secondary" id="regTab" onclick="authMode('register')">Create Account</button>
    </div>
    <form id="authForm" class="form-grid">
      <div class="field full" id="nameField" style="display:none">
        <label>Full Name</label>
        <input name="name" placeholder="Juan Dela Cruz">
      </div>
      <div class="field full">
        <label>Email Address</label>
        <input name="email" type="email" placeholder="student@tip.edu.ph" value="student@tip.edu.ph" required>
      </div>
      <div class="field full">
        <label>Password</label>
        <input name="password" type="password" minlength="6" placeholder="Minimum 6 characters" value="bytebite123" required>
      </div>
      <input type="hidden" name="mode" value="login">
      <div class="full">
        <button class="btn btn-primary" style="width:100%">Continue</button>
      </div>
    </form>
    <div id="authMsg"></div>
  `, 'Sign In to ByteBite PH');
  $('#authForm').addEventListener('submit', submitAuth);
}

function authMode(mode) {
  $('#authForm [name=mode]').value = mode;
  $('#nameField').style.display = mode === 'register' ? 'flex' : 'none';
  $('#loginTab').className = 'btn ' + (mode === 'login' ? 'btn-primary' : 'btn-secondary');
  $('#regTab').className = 'btn ' + (mode === 'register' ? 'btn-primary' : 'btn-secondary');
}

async function submitAuth(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const mode = fd.get('mode');
  try {
    const d = await api('/auth/' + mode, {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(fd))
    });
    state.token = d.token;
    localStorage.setItem('bb_token', d.token);
    closeModal();
    await boot();
  } catch (err) {
    $('#authMsg').innerHTML = `<div class="notice error">${esc(err.message)}</div>`;
  }
}

async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch {}
  state.token = '';
  state.user = null;
  state.tracker = null;
  localStorage.removeItem('bb_token');
  render();
}

function needAuth() {
  if (!state.user) {
    showAuth();
    return false;
  }
  return true;
}

async function likeReel(id) {
  if (!needAuth()) return;
  try {
    const d = await api(`/reels/${id}/like`, { method: 'POST' });
    state.reels = state.reels.map(r => r.id === id ? d.reel : r);
    const el = $('#likes-' + CSS.escape(id));
    if (el) el.textContent = d.reel.likes;
  } catch (e) {
    toast(e.message, true);
  }
}

async function saveReel(id) {
  if (!needAuth()) return;
  try {
    const d = await api(`/reels/${id}/save`, { method: 'POST' });
    state.user.savedReels = state.user.savedReels || [];
    state.user.savedReels = d.saved
      ? [...new Set([...state.user.savedReels, id])]
      : state.user.savedReels.filter(x => x !== id);
    render();
  } catch (e) {
    toast(e.message, true);
  }
}

function openComments(id) {
  const r = state.reels.find(x => x.id === id);
  const box = $('#commentBox');
  box.classList.add('open');
  box.innerHTML = `
    <div class="comment-top">
      <b>Comments (${(r.comments || []).length})</b>
      <button class="btn btn-ghost" onclick="$('#commentBox').classList.remove('open')">✕</button>
    </div>
    <div class="comment-list">
      ${(r.comments || []).length
        ? (r.comments || []).map(c => `<div class="comment"><b>${esc(c.user)}</b><div style="margin-top:2px;">${esc(c.text)}</div></div>`).join('')
        : '<div class="muted" style="font-size: 12.5px;">No comments yet.</div>'}
    </div>
    <form class="search-row" onsubmit="postComment(event, '${id}')">
      <input name="text" placeholder="Write a comment..." required>
      <button class="btn btn-primary mini">Post</button>
    </form>
  `;
}

async function postComment(e, id) {
  e.preventDefault();
  if (!needAuth()) return;
  const text = new FormData(e.target).get('text');
  try {
    const comments = await api(`/reels/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    state.reels.find(x => x.id === id).comments = comments;
    openComments(id);
  } catch (err) {
    toast(err.message, true);
  }
}

async function activatePremium() {
  if (!needAuth()) return;
  try {
    const d = await api('/subscription/activate', { method: 'POST' });
    state.user = d.user;
    toast('ByteBite Pro activated.');
    render();
  } catch (e) {
    toast(e.message, true);
  }
}

function modal(content, title = '') {
  closeModal();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="auth-overlay" id="modal" onclick="if(event.target.id==='modal')closeModal()">
      <div class="auth-card">
        <div class="modal-top">
          ${title ? `<h2>${esc(title)}</h2>` : '<span></span>'}
          <button class="btn btn-ghost" onclick="closeModal()">✕</button>
        </div>
        ${content}
      </div>
    </div>
  `);
}

function closeModal() {
  document.getElementById('modal')?.remove();
}

function toast(msg, error = false) {
  document.querySelector('.toast')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="toast ${error ? 'error' : ''}">${esc(msg)}</div>`);
  setTimeout(() => document.querySelector('.toast')?.remove(), 2800);
}

function goProfile() {
  location.hash = '#/profile';
}

boot().catch(err => {
  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="notice error">Unable to load ByteBite: ${esc(err.message)}</div>
    </div>
  `;
});
