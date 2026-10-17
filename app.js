'use strict';

/*
 * HazeWatch SEA — a Google Maps Platform haze demo.
 *
 * Demo mode runs fully offline with illustrative values.
 * With a browser key it switches to:
 *   - Maps JavaScript API   vector map, Advanced Markers, animated camera,
 *                           satellite view and Photorealistic 3D (maps3d)
 *   - Air Quality API       heatmap tiles, currentConditions:lookup, forecast:lookup
 *   - Weather API           live wind for each city (drives the wind particles)
 *   - Places API (New)      autocomplete search for any SEA location
 *   - Geocoding API         names for dropped pins (click anywhere on the map)
 */

// ---------------------------------------------------------------------------
// Config & data
// ---------------------------------------------------------------------------

const DEFAULT_MAP_ID = 'DEMO_MAP_ID';
const AQ_API = 'https://airquality.googleapis.com/v1';
const WEATHER_API = 'https://weather.googleapis.com/v1';
const SEA_VIEW = { lat: 2.4, lng: 106, zoom: 5 };
const HEATMAP_TYPES = { aqi: 'UAQI_RED_GREEN', pm25: 'PM25_INDIGO_PERSIAN' };
const TIMELINE_PCT = { 0: 5, 12: 28, 24: 51, 48: 95 };
const REFRESH_MS = 10 * 60 * 1000;
const HOUR = 3600e3;

// Demo values are illustrative. windDeg is where the wind blows FROM (meteorological).
const places = [
  { id: 'singapore', name: 'Singapore', meta: 'Central Region', flag: '🇸🇬', lat: 1.3521, lng: 103.8198, aqi: 112, pm: 40.2, windDeg: 225, windKmh: 12, trend: 14 },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', meta: 'Malaysia', flag: '🇲🇾', lat: 3.139, lng: 101.6869, aqi: 96, pm: 34.5, windDeg: 225, windKmh: 9, trend: 8 },
  { id: 'pekanbaru', name: 'Pekanbaru', meta: 'Riau, Indonesia', flag: '🇮🇩', lat: 0.5071, lng: 101.4478, aqi: 158, pm: 69.1, windDeg: 180, windKmh: 7, trend: 22 },
  { id: 'palembang', name: 'Palembang', meta: 'South Sumatra', flag: '🇮🇩', lat: -2.9909, lng: 104.7566, aqi: 136, pm: 54.3, windDeg: 135, windKmh: 6, trend: 16 },
  { id: 'bangkok', name: 'Bangkok', meta: 'Thailand', flag: '🇹🇭', lat: 13.7563, lng: 100.5018, aqi: 68, pm: 20.4, windDeg: 225, windKmh: 10, trend: -4 },
  { id: 'jakarta', name: 'Jakarta', meta: 'Java, Indonesia', flag: '🇮🇩', lat: -6.2088, lng: 106.8456, aqi: 104, pm: 37.7, windDeg: 135, windKmh: 8, trend: 6 },
  { id: 'kuching', name: 'Kuching', meta: 'Sarawak, Malaysia', flag: '🇲🇾', lat: 1.5533, lng: 110.3592, aqi: 82, pm: 26.8, windDeg: 190, windKmh: 11, trend: 3 },
  { id: 'ho-chi-minh', name: 'Ho Chi Minh City', meta: 'Vietnam', flag: '🇻🇳', lat: 10.8231, lng: 106.6297, aqi: 74, pm: 23.6, windDeg: 240, windKmh: 9, trend: -2 },
  // More cities across the region (PM2.5 derived from AQI in demo mode)
  { id: 'jambi', name: 'Jambi', meta: 'Jambi, Indonesia', flag: '🇮🇩', lat: -1.6101, lng: 103.6131, aqi: 148, windDeg: 150, windKmh: 6, trend: 18 },
  { id: 'medan', name: 'Medan', meta: 'North Sumatra', flag: '🇮🇩', lat: 3.5952, lng: 98.6722, aqi: 92, windDeg: 200, windKmh: 8, trend: 5 },
  { id: 'pontianak', name: 'Pontianak', meta: 'West Kalimantan', flag: '🇮🇩', lat: -0.0263, lng: 109.3425, aqi: 131, windDeg: 170, windKmh: 7, trend: 12 },
  { id: 'palangka-raya', name: 'Palangka Raya', meta: 'Central Kalimantan', flag: '🇮🇩', lat: -2.2161, lng: 113.9135, aqi: 171, windDeg: 140, windKmh: 6, trend: 20 },
  { id: 'banjarmasin', name: 'Banjarmasin', meta: 'South Kalimantan', flag: '🇮🇩', lat: -3.3194, lng: 114.5908, aqi: 122, windDeg: 130, windKmh: 8, trend: 9 },
  { id: 'penang', name: 'George Town', meta: 'Penang, Malaysia', flag: '🇲🇾', lat: 5.4141, lng: 100.3288, aqi: 88, windDeg: 220, windKmh: 10, trend: 6 },
  { id: 'bandar-seri-begawan', name: 'Bandar Seri Begawan', meta: 'Brunei', flag: '🇧🇳', lat: 4.9031, lng: 114.9398, aqi: 71, windDeg: 200, windKmh: 9, trend: 4 },
  { id: 'kota-kinabalu', name: 'Kota Kinabalu', meta: 'Sabah, Malaysia', flag: '🇲🇾', lat: 5.9804, lng: 116.0735, aqi: 63, windDeg: 210, windKmh: 11, trend: 1 },
  { id: 'phnom-penh', name: 'Phnom Penh', meta: 'Cambodia', flag: '🇰🇭', lat: 11.5564, lng: 104.9282, aqi: 79, windDeg: 230, windKmh: 8, trend: -1 },
  { id: 'vientiane', name: 'Vientiane', meta: 'Laos', flag: '🇱🇦', lat: 17.9757, lng: 102.6331, aqi: 72, windDeg: 220, windKmh: 7, trend: -3 },
  { id: 'chiang-mai', name: 'Chiang Mai', meta: 'Thailand', flag: '🇹🇭', lat: 18.7883, lng: 98.9853, aqi: 64, windDeg: 230, windKmh: 6, trend: -2 },
  { id: 'yangon', name: 'Yangon', meta: 'Myanmar', flag: '🇲🇲', lat: 16.8409, lng: 96.1735, aqi: 85, windDeg: 225, windKmh: 9, trend: 2 },
  { id: 'hanoi', name: 'Hanoi', meta: 'Vietnam', flag: '🇻🇳', lat: 21.0278, lng: 105.8342, aqi: 118, windDeg: 60, windKmh: 8, trend: 7 },
  { id: 'manila', name: 'Manila', meta: 'Philippines', flag: '🇵🇭', lat: 14.5995, lng: 120.9842, aqi: 58, windDeg: 250, windKmh: 12, trend: -1 },
  // South Asia, East Asia and Oceania
  { id: 'delhi', name: 'New Delhi', meta: 'India', flag: '🇮🇳', lat: 28.6139, lng: 77.209, aqi: 168, windDeg: 300, windKmh: 6, trend: 12 },
  { id: 'mumbai', name: 'Mumbai', meta: 'India', flag: '🇮🇳', lat: 19.076, lng: 72.8777, aqi: 96, windDeg: 270, windKmh: 10, trend: 3 },
  { id: 'lahore', name: 'Lahore', meta: 'Pakistan', flag: '🇵🇰', lat: 31.5204, lng: 74.3587, aqi: 182, windDeg: 310, windKmh: 5, trend: 15 },
  { id: 'dhaka', name: 'Dhaka', meta: 'Bangladesh', flag: '🇧🇩', lat: 23.8103, lng: 90.4125, aqi: 152, windDeg: 320, windKmh: 5, trend: 9 },
  { id: 'kathmandu', name: 'Kathmandu', meta: 'Nepal', flag: '🇳🇵', lat: 27.7172, lng: 85.324, aqi: 110, windDeg: 250, windKmh: 4, trend: 5 },
  { id: 'colombo', name: 'Colombo', meta: 'Sri Lanka', flag: '🇱🇰', lat: 6.9271, lng: 79.8612, aqi: 57, windDeg: 240, windKmh: 16, trend: -2 },
  { id: 'beijing', name: 'Beijing', meta: 'China', flag: '🇨🇳', lat: 39.9042, lng: 116.4074, aqi: 87, windDeg: 330, windKmh: 12, trend: -6 },
  { id: 'shanghai', name: 'Shanghai', meta: 'China', flag: '🇨🇳', lat: 31.2304, lng: 121.4737, aqi: 74, windDeg: 20, windKmh: 14, trend: -2 },
  { id: 'guangzhou', name: 'Guangzhou', meta: 'Guangdong, China', flag: '🇨🇳', lat: 23.1291, lng: 113.2644, aqi: 68, windDeg: 10, windKmh: 11, trend: 1 },
  { id: 'hong-kong', name: 'Hong Kong', meta: 'Hong Kong SAR', flag: '🇭🇰', lat: 22.3193, lng: 114.1694, aqi: 61, windDeg: 60, windKmh: 15, trend: 0 },
  { id: 'taipei', name: 'Taipei', meta: 'Taiwan', flag: '🇹🇼', lat: 25.033, lng: 121.5654, aqi: 48, windDeg: 60, windKmh: 13, trend: -3 },
  { id: 'seoul', name: 'Seoul', meta: 'South Korea', flag: '🇰🇷', lat: 37.5665, lng: 126.978, aqi: 63, windDeg: 300, windKmh: 10, trend: 4 },
  { id: 'tokyo', name: 'Tokyo', meta: 'Japan', flag: '🇯🇵', lat: 35.6762, lng: 139.6503, aqi: 42, windDeg: 20, windKmh: 12, trend: -1 },
  { id: 'ulaanbaatar', name: 'Ulaanbaatar', meta: 'Mongolia', flag: '🇲🇳', lat: 47.8864, lng: 106.9057, aqi: 98, windDeg: 290, windKmh: 9, trend: 11 },
  { id: 'darwin', name: 'Darwin', meta: 'Northern Territory, Australia', flag: '🇦🇺', lat: -12.4634, lng: 130.8456, aqi: 52, windDeg: 120, windKmh: 18, trend: 2 },
  { id: 'sydney', name: 'Sydney', meta: 'New South Wales, Australia', flag: '🇦🇺', lat: -33.8688, lng: 151.2093, aqi: 34, windDeg: 150, windKmh: 17, trend: -1 },
];

// Country for each city (names match Natural Earth so the basemap can highlight them).
const FLAG_COUNTRY = {
  '🇸🇬': 'Singapore', '🇲🇾': 'Malaysia', '🇮🇩': 'Indonesia', '🇹🇭': 'Thailand', '🇻🇳': 'Vietnam', '🇧🇳': 'Brunei', '🇰🇭': 'Cambodia',
  '🇱🇦': 'Laos', '🇲🇲': 'Myanmar', '🇵🇭': 'Philippines', '🇮🇳': 'India', '🇵🇰': 'Pakistan', '🇧🇩': 'Bangladesh', '🇳🇵': 'Nepal',
  '🇱🇰': 'Sri Lanka', '🇨🇳': 'China', '🇭🇰': 'Hong Kong', '🇹🇼': 'Taiwan', '🇰🇷': 'South Korea', '🇯🇵': 'Japan', '🇲🇳': 'Mongolia', '🇦🇺': 'Australia',
};
places.forEach(p => (p.country = FLAG_COUNTRY[p.flag]));
const REGION_GROUPS = [
  { name: 'Southeast Asia', countries: ['Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia', 'Myanmar', 'Philippines', 'Singapore', 'Thailand', 'Vietnam'] },
  { name: 'South Asia', countries: ['Bangladesh', 'India', 'Nepal', 'Pakistan', 'Sri Lanka'] },
  { name: 'East Asia', countries: ['China', 'Hong Kong', 'Japan', 'Mongolia', 'South Korea', 'Taiwan'] },
  { name: 'Oceania', countries: ['Australia'] },
];
const MAJOR_CITIES = new Set(['singapore', 'kuala-lumpur', 'pekanbaru', 'palembang', 'bangkok', 'jakarta', 'kuching', 'ho-chi-minh']);

// Illustrative peatland fire clusters (not live satellite detections).
// All fire clusters are in Indonesia.
const FIRE_COUNTRY = 'Indonesia';
const fireClusters = [
  { name: 'Riau', lat: 0.7, lng: 101.9, n: 10 },
  { name: 'Jambi', lat: -1.6, lng: 103.4, n: 7 },
  { name: 'South Sumatra', lat: -3.2, lng: 105.3, n: 8 },
  { name: 'West Kalimantan', lat: -0.4, lng: 109.9, n: 6 },
  { name: 'Central Kalimantan', lat: -2.3, lng: 113.7, n: 9 },
];

const hotspots = (() => {
  let seed = 2026;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return fireClusters.flatMap(c => Array.from({ length: c.n }, () => {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand());
    return {
      cluster: c.name,
      lat: c.lat + Math.sin(a) * d * 0.7,
      lng: c.lng + Math.cos(a) * d * 0.9,
    };
  }));
})();

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  selectedId: 'singapore',
  hour: 0,
  layer: 'aqi',
  view: '2d',
  watchAll: false,
  countries: new Set(), // empty = all countries
  aiZones: [], // areas the AI flagged, drawn as polygons
  aiHistory: [],
  aiBusy: false,
  showWind: true,
  showFires: true,
  playTimer: null,
  touring: false,
  tourToken: 0,
  live: new Map(),
  lastUpdated: new Date(),
  healthDismissed: false,
};

const gmp = {
  key: null,
  map: null,
  pins: new Map(),
  fireMarkers: [],
  AdvancedMarkerElement: null,
  PinElement: null,
  geocoder: null,
  places: null,
  sessionToken: null,
  flyToken: 0,
  lastPinClick: 0,
  refreshTimer: null,
};

// Offline demo basemap: real Natural Earth coastlines drawn with a Mercator projection.
const demo = { land: [], k: 0, k0: 0, x0: 0, y0: 0, w: 0, h: 0, raf: 0 };

// Photorealistic 3D view (Map3DElement) — created lazily on first switch to 3D.
const view3d = { el: null, lib: null, objs: new Map(), fires: [], haze: null, columnsShown: true, introDone: false };
// Camera used when flying into a city in 3D: low and tilted, so buildings fill the frame.
const CITY_CAMERA = { range: 2600, tilt: 67, heading: 32 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wait = ms => new Promise(r => setTimeout(r, ms));
const fmtTime = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const fmtDay = d => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const placeById = id => places.find(p => p.id === id);
const isLive = () => !!gmp.map;
const inFilter = p => p.custom || !state.countries.size || state.countries.has(p.country);
const visiblePlaces = () => places.filter(inFilter);
const watched = () => places.filter(p => !p.custom && inFilter(p));
const firesVisible = () => state.showFires && (!state.countries.size || state.countries.has(FIRE_COUNTRY));

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const compass = deg => COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];

// US EPA PM2.5 breakpoints (2024 revision): [concLow, concHigh, aqiLow, aqiHigh]
const PM25_BREAKPOINTS = [[0, 9, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500]];
function pmToAqi(pm) {
  const c = Math.floor(Math.max(0, pm) * 10) / 10;
  const [cLo, cHi, aLo, aHi] = PM25_BREAKPOINTS.find(b => c <= b[1]) || PM25_BREAKPOINTS.at(-1);
  return Math.round(((aHi - aLo) / (cHi - cLo)) * (Math.min(c, cHi) - cLo) + aLo);
}
function aqiToPm(aqi) {
  const [cLo, cHi, aLo, aHi] = PM25_BREAKPOINTS.find(b => aqi <= b[3]) || PM25_BREAKPOINTS.at(-1);
  return +(((aqi - aLo) * (cHi - cLo)) / (aHi - aLo) + cLo).toFixed(1);
}
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
// Approximate conversion between 2D zoom levels and 3D camera range (metres).
const zoomToRange = z => 35e6 / 2 ** z;
const rangeToZoom = r => Math.log2(35e6 / r);

function aqiColor(v) {
  if (v == null) return '#9aa8a2';
  return v <= 50 ? '#59a66a' : v <= 100 ? '#d5b540' : v <= 150 ? '#df7b42' : v <= 200 ? '#c9483e' : v <= 300 ? '#8c3356' : '#6d2340';
}
function level(v) {
  return v <= 50 ? 'Good' : v <= 100 ? 'Moderate' : v <= 150 ? 'Unhealthy for sensitive groups' : v <= 200 ? 'Unhealthy' : v <= 300 ? 'Very unhealthy' : 'Hazardous';
}
const POLLUTANT_NAMES = { pm25: 'PM₂.₅', pm10: 'PM₁₀', o3: 'O₃', no2: 'NO₂', so2: 'SO₂', co: 'CO' };

function nearestPoint(series, time) {
  return series.reduce((a, b) => (Math.abs(b.time - time) < Math.abs(a.time - time) ? b : a));
}

// ---------------------------------------------------------------------------
// Readings: live (Google APIs) with demo fallback
// ---------------------------------------------------------------------------

const DEMO_FACTORS = { 0: 1, 12: 1.08, 24: 1.19, 48: 0.91 };

function demoReading(p, hour) {
  if (p.aqi == null) return null;
  const aqi = Math.round(p.aqi * (DEMO_FACTORS[hour] ?? 1) + (p.id === 'pekanbaru' && hour === 24 ? 14 : 0));
  return { aqi, pm: (p.pm * aqi) / p.aqi, windDeg: p.windDeg, windKmh: p.windKmh, trend: p.trend, source: 'demo' };
}

function liveReading(p, hour) {
  const l = state.live.get(p.id);
  if (!l?.current) return null;
  const now = Date.now();
  const point = hour && l.forecast?.length ? nearestPoint(l.forecast, now + hour * HOUR) : l.current;
  const in12 = l.forecast?.length ? nearestPoint(l.forecast, now + 12 * HOUR) : null;
  return {
    aqi: point.aqi,
    pm: point.pm,
    windDeg: l.wind?.deg ?? p.windDeg,
    windKmh: l.wind?.kmh ?? p.windKmh,
    trend: in12 ? Math.round(((in12.aqi - l.current.aqi) / Math.max(1, l.current.aqi)) * 100) : 0,
    local: point.local,
    dominant: point.dominant,
    health: l.current.health,
    source: 'live',
  };
}

const reading = (p, hour = state.hour) => liveReading(p, hour) || demoReading(p, hour);

function forecastSeries(p) {
  const l = state.live.get(p.id);
  const steps = Array.from({ length: 12 }, (_, i) => i * 4);
  if (l?.current && l.forecast?.length) {
    return steps.map(h => (h === 0 ? l.current.aqi : nearestPoint(l.forecast, Date.now() + h * HOUR).aqi));
  }
  const r = demoReading(p, state.hour);
  return r ? [0.78, 0.91, 1, 0.86, 0.72, 0.68, 0.77, 0.9, 1.08, 1.16, 1.02, 0.88].map(n => Math.round(n * r.aqi)) : [];
}

// ---------------------------------------------------------------------------
// API calls (every request is logged to the on-screen inspector)
// ---------------------------------------------------------------------------

const apiLog = [];

function logApi(method, label, status, ms) {
  apiLog.unshift({ method, label, status, ms, at: new Date() });
  apiLog.length = Math.min(apiLog.length, 60);
  renderApiLog();
}

async function track(method, label, fn) {
  const t0 = performance.now();
  let status = 'ERR';
  try {
    const result = await fn();
    status = result?.__status ?? 'OK';
    return result;
  } finally {
    logApi(method, label, status, Math.round(performance.now() - t0));
  }
}

function callApi(label, url, body) {
  return track(body ? 'POST' : 'GET', label, async () => {
    const res = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      logApi('', `↳ ${json.error?.status || 'HTTP ' + res.status}: ${json.error?.message || ''}`.slice(0, 140), res.status, 0);
      throw new Error(json.error?.message || `HTTP ${res.status}`);
    }
    return Object.assign(json, { __status: res.status });
  });
}

function parseConditions(json) {
  const pm = json.pollutants?.find(x => x.code === 'pm25')?.concentration?.value;
  const local = json.indexes?.find(i => i.code !== 'uaqi');
  const uaqi = json.indexes?.find(i => i.code === 'uaqi');
  return {
    time: json.dateTime ? new Date(json.dateTime).getTime() : Date.now(),
    pm,
    aqi: pm != null ? pmToAqi(pm) : null,
    local: local ? { name: local.displayName, aqi: local.aqiDisplay ?? local.aqi, category: local.category } : null,
    dominant: (local || uaqi)?.dominantPollutant,
    health: json.healthRecommendations,
  };
}

async function loadLive(p) {
  const key = encodeURIComponent(gmp.key);
  const location = { latitude: p.lat, longitude: p.lng };
  const start = new Date(Math.ceil(Date.now() / HOUR) * HOUR);
  const end = new Date(start.getTime() + 48 * HOUR);

  const [current, forecast, weather] = await Promise.allSettled([
    callApi(`Air Quality · currentConditions · ${p.name}`, `${AQ_API}/currentConditions:lookup?key=${key}`, {
      location,
      universalAqi: true,
      languageCode: 'en',
      extraComputations: ['LOCAL_AQI', 'HEALTH_RECOMMENDATIONS', 'DOMINANT_POLLUTANT_CONCENTRATION', 'POLLUTANT_CONCENTRATION'],
    }),
    callApi(`Air Quality · forecast 48h · ${p.name}`, `${AQ_API}/forecast:lookup?key=${key}`, {
      location,
      period: { startTime: start.toISOString(), endTime: end.toISOString() },
      pageSize: 49,
      universalAqi: true,
      languageCode: 'en',
      extraComputations: ['LOCAL_AQI', 'POLLUTANT_CONCENTRATION'],
    }),
    callApi(`Weather · currentConditions · ${p.name}`, `${WEATHER_API}/currentConditions:lookup?key=${key}&location.latitude=${p.lat}&location.longitude=${p.lng}`),
  ]);

  const entry = state.live.get(p.id) || {};
  if (current.status === 'fulfilled') {
    const c = parseConditions(current.value);
    if (c.aqi != null) entry.current = c;
  }
  if (forecast.status === 'fulfilled') {
    entry.forecast = (forecast.value.hourlyForecasts || []).map(parseConditions).filter(x => x.aqi != null);
  }
  if (weather.status === 'fulfilled' && weather.value.wind) {
    const w = weather.value.wind;
    entry.wind = { deg: w.direction?.degrees ?? 0, kmh: Math.round(w.speed?.value ?? 0) };
  }
  state.live.set(p.id, entry);
  return !!entry.current;
}

// Only the cities in the current country filter are fetched, to keep request volume down.
async function refreshLive({ quiet = false, onlyMissing = false } = {}) {
  const targets = visiblePlaces().filter(p => !onlyMissing || !state.live.has(p.id));
  if (!targets.length || !gmp.map) return;
  const fixed = targets.filter(p => !p.custom);
  const results = await Promise.all(fixed.map(p => loadLive(p).catch(() => false)));
  const ok = results.filter(Boolean).length;
  state.lastUpdated = new Date();
  renderAll();
  updateWindFromData();
  if (quiet || !gmp.map) return;
  if (ok) toast(`Live air quality loaded for ${ok}/${fixed.length} cities`);
  else toast('Air Quality API returned no data — showing demo values. Is the API enabled for this key?');
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function markerValue(r) {
  if (!r) return '…';
  return state.layer === 'pm25' ? Math.round(r.pm) : r.aqi;
}

function renderDemoMarkers() {
  if (!demo.k) return;
  $('#demoMarkers').innerHTML = visiblePlaces().map(p => {
    const r = reading(p);
    const [x, y] = project(p.lat, p.lng);
    const cls = [p.id === state.selectedId && 'active', MAJOR_CITIES.has(p.id) && 'major'].filter(Boolean).join(' ');
    return `<button class="city-marker ${cls}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px" data-id="${p.id}" aria-label="${esc(p.name)}, AQI ${r?.aqi ?? 'loading'}"><span class="bubble" style="background:${aqiColor(r?.aqi)}"><b>${markerValue(r)}</b></span><span>${esc(p.name)}</span></button>`;
  }).join('');
  $$('.city-marker').forEach(b => (b.onclick = () => selectPlace(b.dataset.id)));
}

function renderDemoFires() {
  if (!firesVisible() || !demo.k) return ($('#demoFires').innerHTML = '');
  $('#demoFires').innerHTML = hotspots.map((h, i) => {
    const [x, y] = project(h.lat, h.lng);
    return `<i class="fire-dot" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;animation-delay:${(i % 7) * 0.25}s"></i>`;
  }).join('');
}

function renderWatch() {
  const score = p => reading(p)?.aqi ?? -1;
  const list = watched();
  const sorted = list.sort((a, b) => score(b) - score(a)).slice(0, state.watchAll ? undefined : 4);
  $('#viewAllBtn').textContent = state.watchAll ? 'Top 4' : `View all ${list.length}`;
  $('#viewAllBtn').hidden = list.length <= 4;
  $('#watchList').innerHTML = sorted.map(p => {
    const r = reading(p);
    const unit = state.layer === 'pm25' ? 'µg' : 'AQI';
    return `<button class="watch-item ${state.selectedId === p.id ? 'active' : ''}" data-id="${p.id}"><span class="flag">${p.flag}</span><span><b>${esc(p.name)}</b><small>${esc(p.meta)}${r?.source === 'live' ? ' · live' : ''}</small></span><span class="aqi-chip" style="background:${aqiColor(r?.aqi)}">${markerValue(r)} ${unit}</span></button>`;
  }).join('');
  $$('.watch-item').forEach(b => (b.onclick = () => selectPlace(b.dataset.id)));
}

function renderDetail() {
  const p = placeById(state.selectedId);
  if (!p) return;
  const r = reading(p);
  $('#detailFlag').textContent = p.flag;
  $('#detailName').textContent = p.name;
  $('#detailMeta').textContent = p.meta;
  $('#detailCard').hidden = false;

  if (!r) {
    $('#detailAqi').textContent = '…';
    $('#detailAqi').style.color = aqiColor(null);
    $('#detailLevel').textContent = 'Fetching live data…';
    $('#detailPm').innerHTML = '– <small>µg/m³</small>';
    $('#detailWind').innerHTML = '– <small>km/h</small>';
    $('#detailTrend').textContent = '';
    $('#miniForecast').innerHTML = '';
    $('#detailSource').textContent = 'Calling the Air Quality API…';
    return;
  }

  $('#detailAqi').textContent = r.aqi;
  $('#detailAqi').style.color = aqiColor(r.aqi);
  $('#detailLevel').textContent = level(r.aqi);
  $('#detailPm').innerHTML = `${r.pm.toFixed(1)} <small>µg/m³</small>`;
  $('#detailWind').innerHTML = r.windDeg != null ? `${compass(r.windDeg)} ${r.windKmh} <small>km/h</small>` : '– <small>km/h</small>';
  $('#detailTrend').textContent = `${r.trend >= 0 ? '↗' : '↘'} ${Math.abs(r.trend)}% · 12h`;
  $('#detailTrend').style.color = r.trend >= 0 ? '#c4513d' : '#39835d';
  $('#miniForecast').innerHTML = forecastSeries(p).map((v, i) => `<i style="height:${Math.max(8, Math.min(54, v / 2.3))}px;background:${aqiColor(v)}" title="+${i * 4}h · AQI ${v}"></i>`).join('');

  if (r.source === 'live') {
    const extras = [r.dominant && `dominant ${POLLUTANT_NAMES[r.dominant] || r.dominant}`, r.local && `${r.local.name} ${r.local.aqi}`].filter(Boolean);
    $('#detailSource').innerHTML = `<i class="src-dot"></i>Live · Google Air Quality API${extras.length ? ' · ' + esc(extras.join(' · ')) : ''}`;
  } else {
    $('#detailSource').textContent = 'Demo data · illustrative only';
  }
}

function renderHealth() {
  const card = $('#healthCard');
  const p = placeById(state.selectedId);
  const r = p && reading(p, 0);
  card.hidden = state.healthDismissed;
  if (r?.health) {
    $('#healthTitle').textContent = `Health advisory · ${p.name}`;
    $('#healthText').textContent = r.health.lungDiseasePopulation || r.health.generalPopulation || '';
  } else {
    const v = r?.aqi ?? 0;
    $('#healthTitle').textContent = p ? `Health advisory · ${p.name}` : 'Health advisory';
    $('#healthText').textContent = !p ? '' : v > 150
      ? `Everyone in ${p.name} should limit outdoor exertion; sensitive groups should stay indoors.`
      : v > 100
      ? `Sensitive groups in ${p.name} should reduce prolonged outdoor activity.`
      : `Air quality in ${p.name} is acceptable for most people.`;
  }
}

function renderRegional() {
  const values = watched().map(p => reading(p)?.aqi).filter(v => v != null);
  const worst = Math.max(...values, 0);
  const above = values.filter(v => v > 100).length;
  const badge = worst > 150 ? 'High' : worst > 100 ? 'Elevated' : worst > 50 ? 'Moderate' : 'Low';
  $('#statusBadge').textContent = badge;
  $('#statusBadge').style.background = worst > 150 ? '#f2a07f' : worst > 100 ? '#f3c977' : '#bddf8b';
  const when = state.hour ? `at +${state.hour}h` : 'right now';
  const hazeBelt = ['Indonesia', 'Malaysia', 'Singapore', 'Brunei'].some(c => !state.countries.size || state.countries.has(c));
  $('#statusText').textContent = `${above} of ${values.length} watched cities exceed AQI 100 ${when}.` +
    (hazeBelt ? ' Hotspots in Sumatra and Kalimantan, plus south-westerly winds, may carry smoke toward Peninsular Malaysia and Singapore.' : '');
  $('#regionName').textContent = filterLabel();
  const d = state.lastUpdated;
  $('#updatedAt').textContent = `Updated ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${fmtTime(d)} · ${isLive() ? 'live' : 'demo'}`;
}

function renderLegend() {
  const pm = state.layer === 'pm25';
  $('#legendTitle').textContent = pm ? 'PM₂.₅ · µg/m³' : 'US AQI';
  $('#legendTicks').innerHTML = (pm ? ['0', '9', '35', '55', '125+'] : ['0', '50', '100', '150', '200+']).map(t => `<span>${t}</span>`).join('');
  $('#legendNote').textContent = isLive() && state.view === '3d'
    ? 'Photorealistic 3D · column height & colour = US AQI'
    : isLive()
    ? `Heatmap: Google ${pm ? 'PM₂.₅ (indigo–persian)' : 'Universal AQI (red–green)'} tiles`
    : 'Demo haze field · illustrative';
}

function renderToolbar() {
  $$('.tool[data-layer]').forEach(b => {
    const l = b.dataset.layer;
    const on = l === 'wind' ? state.showWind : l === 'fires' ? state.showFires : state.layer === l;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on);
  });
  const stage = $('#mapStage');
  stage.classList.toggle('layer-pm25', state.layer === 'pm25');
  stage.classList.toggle('layer-aqi', state.layer === 'aqi');
  stage.classList.toggle('fires-off', !state.showFires);
}

function renderDemoHaze() {
  const values = watched().map(p => reading(p)?.aqi ?? 0);
  const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  $('#demoMap').style.setProperty('--haze', Math.min(1.6, Math.max(0.5, avg / 105)).toFixed(2));
  if (!demo.k || !firesVisible()) return ($('#demoHaze').innerHTML = '');
  const downwind = (wind.deg + 180) % 360;
  $('#demoHaze').innerHTML = fireClusters.map(c => {
    const [x, y] = project(c.lat, c.lng);
    const size = kmToPx(c.lat, 380 + c.n * 25);
    return `<i class="haze-plume" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${(size * 1.7).toFixed(0)}px;height:${size.toFixed(0)}px;transform:translate(-25%,-50%) rotate(${downwind - 90}deg)"></i>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Demo basemap (offline): Mercator projection, drag to pan, wheel to zoom
// ---------------------------------------------------------------------------

const MAP_LABELS = [
  ['MYANMAR', 21, 95.6, 'country'], ['THAILAND', 16, 101.3, 'country'], ['LAOS', 19.8, 102.4, 'country'], ['CAMBODIA', 13.1, 104.8, 'country'],
  ['VIETNAM', 15.2, 108.2, 'country'], ['MALAYSIA', 4.8, 102.2, 'country'], ['PHILIPPINES', 11.6, 123.3, 'country'], ['INDONESIA', -4.4, 117.5, 'country'],
  ['SUMATRA', -2.4, 102.1, 'island'], ['BORNEO', 0.9, 114.3, 'island'], ['JAVA', -7.5, 110.3, 'island'], ['SULAWESI', -2.1, 120.8, 'island'],
  ['South China Sea', 12.8, 113.6, 'sea'], ['Andaman Sea', 10.6, 96.4, 'sea'], ['Java Sea', -5, 111.8, 'sea'], ['Gulf of Thailand', 9.6, 101.6, 'sea'],
  ['Strait of Malacca', 3.3, 99.6, 'sea'], ['Celebes Sea', 3.6, 122.2, 'sea'], ['Indian Ocean', -5.5, 97.5, 'sea'],
  ['INDIA', 22.5, 79, 'country'], ['PAKISTAN', 29.2, 68.5, 'country'], ['CHINA', 33.5, 102, 'country'], ['MONGOLIA', 46.3, 101, 'country'],
  ['JAPAN', 38.6, 141.6, 'country'], ['AUSTRALIA', -25, 134, 'country'], ['NEW GUINEA', -5, 141, 'island'],
  ['Bay of Bengal', 15, 88.5, 'sea'], ['Arabian Sea', 15, 65, 'sea'], ['Philippine Sea', 18, 131, 'sea'], ['East China Sea', 28.5, 125.5, 'sea'],
  ['Pacific Ocean', 8, 152, 'sea'], ['Timor Sea', -11, 126.5, 'sea'],
];

const mercX = lng => (lng * Math.PI) / 180;
const mercY = lat => Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, lat)) * Math.PI) / 360));
const project = (lat, lng) => [demo.w / 2 + (mercX(lng) - demo.x0) * demo.k, demo.h / 2 - (mercY(lat) - demo.y0) * demo.k];
const kmToPx = (lat, km) => (demo.k * (km / 6371)) / Math.cos((lat * Math.PI) / 180);

async function loadDemoLand() {
  try {
    const features = await (await fetch('data/world-land.json')).json();
    demo.land = features.map(f => ({
      name: f.name,
      rings: f.polygons.flat().map(ring => {
        const pts = ring.map(([lng, lat]) => [mercX(lng), mercY(lat)]);
        pts.box = pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [1e9, 1e9, -1e9, -1e9]);
        return pts;
      }),
    }));
  } catch {
    toast('Could not load coastlines — serve the folder over http (see README)');
  }
  renderDemoMap();
}

// Bounding box of the cities in the current filter, with a margin.
function filterBounds() {
  const list = watched();
  const lats = list.map(p => p.lat), lngs = list.map(p => p.lng);
  const m = 2.5;
  let b = { w: Math.min(...lngs) - m, e: Math.max(...lngs) + m, s: Math.min(...lats) - m, n: Math.max(...lats) + m };
  // Keep small selections (one city) from zooming in too far.
  const grow = (lo, hi, min) => (hi - lo < min ? [(lo + hi) / 2 - min / 2, (lo + hi) / 2 + min / 2] : [lo, hi]);
  [b.w, b.e] = grow(b.w, b.e, 9);
  [b.s, b.n] = grow(b.s, b.n, 7);
  return b;
}

function fitDemo(bounds = filterBounds()) {
  const pad = demo.w > 900 ? { l: $('#aiPanel').hidden ? 60 : 450, r: 290, t: 110, b: 130 } : { l: 16, r: 16, t: 110, b: 130 };
  const x1 = mercX(bounds.w), x2 = mercX(bounds.e), y1 = mercY(bounds.s), y2 = mercY(bounds.n);
  const k = Math.min((demo.w - pad.l - pad.r) / (x2 - x1), (demo.h - pad.t - pad.b) / (y2 - y1));
  demo.k = demo.k0 = k;
  demo.x0 = (x1 + x2) / 2 - (pad.l + (demo.w - pad.l - pad.r) / 2 - demo.w / 2) / k;
  demo.y0 = (y1 + y2) / 2 + (pad.t + (demo.h - pad.t - pad.b) / 2 - demo.h / 2) / k;
}

function ringPath(ring) {
  const { w, h, k, x0, y0 } = demo;
  const [bx1, by1, bx2, by2] = ring.box;
  if (w / 2 + (bx2 - x0) * k < -50 || w / 2 + (bx1 - x0) * k > w + 50 || h / 2 - (by1 - y0) * k < -50 || h / 2 - (by2 - y0) * k > h + 50) return '';
  let d = '', px = 1e9, py = 1e9, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const [mx, my] of ring) {
    const x = w / 2 + (mx - x0) * k, y = h / 2 - (my - y0) * k;
    if (Math.abs(x - px) + Math.abs(y - py) < 0.8) continue; // drop sub-pixel detail
    d += (d ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
    px = x; py = y;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const offscreen = maxX < -50 || minX > w + 50 || maxY < -50 || minY > h + 50;
  return offscreen || maxX - minX + maxY - minY < 1.5 ? '' : d + 'Z';
}

function renderDemoMap() {
  if (!demo.w) return;
  if (!demo.k) fitDemo();
  const grat = [];
  for (let lng = 80; lng <= 140; lng += 5) {
    const [x] = project(0, lng);
    grat.push(`M${x.toFixed(1)},0V${demo.h}`);
  }
  for (let lat = -20; lat <= 30; lat += 5) {
    const [, y] = project(lat, 0);
    grat.push(`M0,${y.toFixed(1)}H${demo.w}`);
  }
  const filtering = state.countries.size > 0;
  const land = demo.land.map(f => {
    const d = f.rings.map(ringPath).join('');
    const cls = filtering ? (state.countries.has(f.name) ? ' sel' : ' dim') : '';
    return d ? `<path class="land-path${cls}" d="${d}"/>` : '';
  }).join('');
  const labels = MAP_LABELS.map(([text, lat, lng, cls]) => {
    const [x, y] = project(lat, lng);
    return `<text class="${cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${text}</text>`;
  }).join('');
  $('#demoSvg').innerHTML = `<path class="grat" d="${grat.join('')}"/><g class="land">${land}</g>${labels}${demoZonesSvg()}`;
  $('#demoMap').dataset.zoom = `${Math.round((demo.k / demo.k0) * 100)}%`;
  $('#mapStage').classList.toggle('demo-compact', demo.k < 2700);
  $('#demoSvg').classList.toggle('far', demo.k < 1100);
  renderDemoFires();
  renderDemoMarkers();
  renderDemoHaze();
}

function scheduleDemoRender() {
  cancelAnimationFrame(demo.raf);
  demo.raf = requestAnimationFrame(renderDemoMap);
}

// Zoom by `factor` keeping the screen point (px, py) fixed.
function zoomDemo(factor, px = demo.w / 2, py = demo.h / 2) {
  const k = Math.max(demo.w / (2 * Math.PI), Math.min(60000, demo.k * factor));
  const mx = demo.x0 + (px - demo.w / 2) / demo.k, my = demo.y0 - (py - demo.h / 2) / demo.k;
  demo.k = k;
  demo.x0 = mx - (px - demo.w / 2) / k;
  demo.y0 = my + (py - demo.h / 2) / k;
  scheduleDemoRender();
}

function setupDemoMap() {
  const el = $('#demoMap');
  new ResizeObserver(() => {
    const r = el.getBoundingClientRect();
    if (!r.width || (r.width === demo.w && r.height === demo.h)) return;
    demo.w = r.width;
    demo.h = r.height;
    if (!demo.k0) fitDemo();
    renderDemoMap();
  }).observe(el);

  let drag = null;
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('.city-marker')) return;
    drag = { x: e.clientX, y: e.clientY };
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
  });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    demo.x0 -= (e.clientX - drag.x) / demo.k;
    demo.y0 += (e.clientY - drag.y) / demo.k;
    drag = { x: e.clientX, y: e.clientY };
    scheduleDemoRender();
  });
  const end = () => {
    drag = null;
    el.classList.remove('dragging');
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  loadDemoLand();
}

function renderAll() {
  renderDemoMarkers();
  refreshGooglePins();
  sync3d();
  renderWatch();
  renderDetail();
  renderHealth();
  renderRegional();
  renderLegend();
  renderToolbar();
  renderDemoHaze();
}

function renderApiLog() {
  $('#apiCount').textContent = `${apiLog.filter(e => e.method).length} calls`;
  if (!apiLog.length) return;
  $('#apiLog').innerHTML = apiLog.map(e => {
    if (!e.method) return `<li class="api-err">${esc(e.label)}</li>`;
    const ok = typeof e.status === 'number' ? e.status < 400 : e.status !== 'ERR';
    return `<li><span class="m">${e.method}</span><span class="l">${esc(e.label)}</span><span class="s ${ok ? 'ok' : 'bad'}">${e.status}</span><span class="t">${e.ms ? e.ms + 'ms' : ''}</span></li>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

function selectPlace(id, { fly = true } = {}) {
  const p = placeById(id);
  if (!p) return;
  if (!inFilter(p)) setCountries([...state.countries, p.country], { fit: false });
  if (state.selectedId !== id) state.healthDismissed = false;
  state.selectedId = id;
  renderAll();
  if (!fly || !gmp.map) return;
  if (state.view === '3d' && view3d.el) fly3dCity(p);
  else flyTo({ lat: p.lat, lng: p.lng, zoom: Math.max(gmp.map.getZoom(), 8), ms: 1600 });
}

function setLayer(layer) {
  state.layer = layer;
  setHeatmap();
  renderAll();
}

function setWind(on) {
  state.showWind = on;
  renderToolbar();
  startWind();
}

function syncFires() {
  const on = firesVisible();
  gmp.fireMarkers.forEach(m => (m.map = on ? gmp.map : null));
  if (view3d.el) view3d.fires.forEach(f => (on ? view3d.el.append(f) : f.remove()));
  renderDemoFires();
  renderDemoHaze();
}

function setFires(on) {
  state.showFires = on;
  syncFires();
  renderToolbar();
}

function updateForecast(nextHour) {
  state.hour = Number(nextHour);
  $$('#stepTabs button').forEach(b => b.classList.toggle('active', Number(b.dataset.hour) === state.hour));
  const pct = TIMELINE_PCT[state.hour];
  $('#timelineTrack i').style.width = pct + '%';
  $('#timelineTrack button').style.left = pct + '%';
  const t = new Date(Date.now() + state.hour * HOUR);
  $('#forecastTime').textContent = state.hour ? `+${state.hour} hours · ${fmtTime(t)}` : `Now · ${fmtTime(t)}`;
  $('#forecastDate').textContent = fmtDay(t);
  renderAll();
}

function renderTimelineLabels() {
  $('#timelineLabels').innerHTML = [0, 1, 2, 3].map(i => {
    const d = new Date(Date.now() + i * 24 * HOUR);
    return `<span>${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</span>`;
  }).join('');
}

function togglePlay(force) {
  const playing = !!state.playTimer;
  const shouldPlay = force ?? !playing;
  if (playing) {
    clearInterval(state.playTimer);
    state.playTimer = null;
  }
  $('#playBtn').textContent = shouldPlay ? '❚❚' : '▶';
  if (!shouldPlay) return;
  const hours = Object.keys(TIMELINE_PCT).map(Number);
  let i = hours.indexOf(state.hour);
  state.playTimer = setInterval(() => updateForecast(hours[(i = (i + 1) % hours.length)]), 1400);
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2800);
}

function setMapZoom(direction, origin) {
  if (state.view === '3d' && view3d.el) {
    view3d.el.range = Math.max(800, Math.min(2e7, view3d.el.range * (direction > 0 ? 0.5 : 2)));
    return;
  }
  if (gmp.map) {
    gmp.map.setZoom(Math.max(2, Math.min(16, Math.round(gmp.map.getZoom()) + direction)));
    return;
  }
  zoomDemo(direction > 0 ? 1.5 : 1 / 1.5, origin?.x, origin?.y);
}

// --- Search: local watch list + Google Places autocomplete ------------------

let searchSeq = 0;

async function renderSearch(query) {
  const box = $('#searchResults');
  const q = query.trim().toLowerCase();
  const local = places.filter(p => !q || (p.name + ' ' + p.meta).toLowerCase().includes(q)).slice(0, q ? 5 : 8);
  const localHtml = local.map(p => `<button data-id="${p.id}"><span>${p.flag} ${esc(p.name)}</span><b>${reading(p)?.aqi ?? '…'} AQI</b></button>`).join('');
  const bind = () => {
    $$('#searchResults button[data-id]').forEach(b => (b.onclick = () => { selectPlace(b.dataset.id); closeSearch(); }));
  };

  box.innerHTML = localHtml || (gmp.places && q.length >= 2 ? '' : '<button disabled>No location found</button>');
  if (gmp.places && q.length >= 2) box.innerHTML += '<div class="search-group">Google Places</div><button disabled>Searching…</button>';
  box.hidden = false;
  bind();

  if (!gmp.places || q.length < 2) return;
  const seq = ++searchSeq;
  await wait(220);
  if (seq !== searchSeq) return;
  try {
    const { AutocompleteSuggestion } = gmp.places;
    const { suggestions } = await track('GET', `Places · autocomplete "${query.trim()}"`, () =>
      AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: query, sessionToken: gmp.sessionToken }));
    if (seq !== searchSeq) return;
    const preds = suggestions.map(s => s.placePrediction).filter(Boolean).slice(0, 5);
    box.innerHTML = localHtml + '<div class="search-group">Google Places</div>' + (preds.length
      ? preds.map((pr, i) => `<button data-pred="${i}"><span>📍 ${esc(pr.mainText?.text ?? pr.text.text)}</span><small>${esc(pr.secondaryText?.text ?? '')}</small></button>`).join('')
      : '<button disabled>No matching places</button>');
    bind();
    $$('#searchResults button[data-pred]').forEach(b => (b.onclick = async () => {
      closeSearch();
      const place = preds[Number(b.dataset.pred)].toPlace();
      await track('GET', 'Places · place details', () => place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] }));
      gmp.sessionToken = new gmp.places.AutocompleteSessionToken();
      probe(place.location.lat(), place.location.lng(), { name: place.displayName, meta: place.formattedAddress, zoom: 10 });
    }));
  } catch (err) {
    if (seq === searchSeq) box.innerHTML = localHtml + '<button disabled>Places search unavailable — enable Places API (New)</button>';
  }
}

function closeSearch() {
  searchSeq++;
  $('#searchResults').hidden = true;
  $('#searchInput').value = '';
  $('#searchInput').blur();
}

// --- Probe: click anywhere on the map (or pick a Places result) ------------

async function probe(lat, lng, { name, meta, zoom } = {}) {
  const existing = places.findIndex(p => p.id === 'probe');
  if (existing >= 0) places.splice(existing, 1);
  const p = { id: 'probe', custom: true, flag: '📍', lat, lng, name: name || 'Dropped pin', meta: meta || `${lat.toFixed(3)}, ${lng.toFixed(3)}` };
  places.push(p);
  state.live.delete('probe');
  selectPlace('probe', { fly: false });
  if (zoom && gmp.map) state.view === '3d' && view3d.el ? fly3dCity(p) : flyTo({ lat, lng, zoom, ms: 1800 });

  const tasks = [loadLive(p)];
  if (!name && gmp.geocoder) {
    tasks.push(track('GET', 'Geocoding · reverse', () => gmp.geocoder.geocode({ location: { lat, lng } })).then(({ results }) => {
      const best = results.find(r => r.types.includes('locality')) || results.find(r => r.types.includes('administrative_area_level_1')) || results[0];
      if (best) {
        p.name = best.address_components[0].long_name;
        p.meta = best.formatted_address;
      }
    }).catch(() => {}));
  }
  const [ok] = await Promise.all(tasks);
  if (placeById('probe') !== p) return;
  renderAll();
  if (!ok) toast('No air-quality coverage for this point');
}

// ---------------------------------------------------------------------------
// Google Maps Platform
// ---------------------------------------------------------------------------

function installMapsLoader(key) {
  if (window.google?.maps?.importLibrary) return;
  // Google's dynamic library import bootstrap:
  // https://developers.google.com/maps/documentation/javascript/load-maps-js-api
  /* eslint-disable */
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({ key, v: new URLSearchParams(location.search).get('v') || 'weekly' });
  /* eslint-enable */
}

async function connectGoogle(key, mapId) {
  if (gmp.map) return;
  gmp.key = key;

  setConnecting(true);
  window.gm_authFailure = () => {
    setConnecting(false);
    toast('Google rejected this key (check referrer restrictions and enabled APIs)');
    $('#googleMap').style.display = 'none';
    $('#demoMap').style.display = '';
    gmp.map = null;
    clearInterval(gmp.refreshTimer);
    setConnectedUi(false);
    renderAll();
    showEnvNotice('Google rejected GOOGLE_MAPS_API_KEY — check its referrer restrictions and enabled APIs.');
  };

  try {
    installMapsLoader(key);
    const t0 = performance.now();
    const [{ Map: GoogleMap, RenderingType }, { AdvancedMarkerElement, PinElement }] = await Promise.all([
      google.maps.importLibrary('maps'),
      google.maps.importLibrary('marker'),
    ]);
    logApi('GET', 'Maps JavaScript API · maps + marker libraries', 200, Math.round(performance.now() - t0));
    gmp.AdvancedMarkerElement = AdvancedMarkerElement;
    gmp.PinElement = PinElement;

    gmp.map = new GoogleMap($('#googleMap'), {
      center: { lat: SEA_VIEW.lat, lng: SEA_VIEW.lng },
      zoom: SEA_VIEW.zoom,
      minZoom: 2,
      maxZoom: 16,
      mapId: mapId || DEFAULT_MAP_ID,
      renderingType: RenderingType.VECTOR,
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: 'greedy',
      mapTypeId: state.view === 'satellite' ? 'hybrid' : 'roadmap',
    });
    const compact = () => $('#mapStage').classList.toggle('compact-pins', gmp.map.getZoom() < 6.5);
    gmp.map.addListener('zoom_changed', compact);
    compact();
    $('#googleMap').style.display = 'block';
    $('#demoMap').style.display = 'none';
    google.maps.event.addListenerOnce(gmp.map, 'tilesloaded', () => setConnecting(false));
    setTimeout(() => setConnecting(false), 8000);

    gmp.map.addListener('click', e => {
      if (state.touring || Date.now() - gmp.lastPinClick < 400 || !e.latLng) return;
      probe(e.latLng.lat(), e.latLng.lng());
    });

    setHeatmap();
    createFireMarkers();
    refreshGooglePins();
    setConnectedUi(true);
    showAll({ expand: false });
    // Photorealistic 3D is the default live view (V cycles 2D / 3D / Satellite).
    let startView = '3d';
    try { startView = localStorage.getItem('hazewatch_view') || '3d'; } catch {}
    if (state.view !== '2d' && state.view !== startView) startView = state.view;
    state.view = '2d';
    if (startView !== '2d') setView(startView);

    // Optional libraries: the demo still works if these APIs aren't enabled.
    google.maps.importLibrary('places').then(lib => {
      gmp.places = lib;
      gmp.sessionToken = new lib.AutocompleteSessionToken();
    }).catch(() => {});
    google.maps.importLibrary('geocoding').then(({ Geocoder }) => (gmp.geocoder = new Geocoder())).catch(() => {});

    await refreshLive();
    clearInterval(gmp.refreshTimer);
    gmp.refreshTimer = setInterval(() => refreshLive({ quiet: true }), REFRESH_MS);
  } catch (err) {
    console.error(err);
    setConnecting(false);
    showEnvNotice('Google Maps could not load — check GOOGLE_MAPS_API_KEY in .env and the enabled APIs.');
    gmp.map = null;
    $('#googleMap').style.display = 'none';
    $('#demoMap').style.display = '';
  }
}

// While Google Maps loads, hide the offline basemap so it never flashes on screen.
function setConnecting(on) {
  $('#mapStage').classList.toggle('connecting', on);
}

function setConnectedUi(connected) {
  $('#livePill').classList.toggle('demo', !connected);
  $('#livePill span').textContent = connected ? 'Live · Google' : 'Offline demo';
}

function setHeatmap() {
  if (!gmp.map) return;
  const type = HEATMAP_TYPES[state.layer];
  const key = encodeURIComponent(gmp.key);
  gmp.map.overlayMapTypes.clear();
  gmp.map.overlayMapTypes.push(new google.maps.ImageMapType({
    getTileUrl: (c, z) => `${AQ_API}/mapTypes/${type}/heatmapTiles/${z}/${c.x}/${c.y}?key=${key}`,
    tileSize: new google.maps.Size(256, 256),
    opacity: 0.55,
    name: `Air Quality · ${type}`,
  }));
  logApi('GET', `Air Quality · heatmapTiles/${type}/{z}/{x}/{y}`, 'tiles', 0);
}

function pinElement() {
  const el = document.createElement('div');
  el.className = 'gmp-pin';
  el.innerHTML = '<span class="bubble"><b></b></span><span class="pin-label"></span>';
  return el;
}

function refreshGooglePins() {
  if (!gmp.map || !gmp.AdvancedMarkerElement) return;
  for (const [id, pin] of gmp.pins) {
    if (!placeById(id)) {
      pin.marker.map = null;
      gmp.pins.delete(id);
    }
  }
  for (const p of places) {
    if (!inFilter(p)) {
      if (gmp.pins.has(p.id)) gmp.pins.get(p.id).marker.map = null;
      continue;
    }
    let pin = gmp.pins.get(p.id);
    if (!pin) {
      const el = pinElement();
      const marker = new gmp.AdvancedMarkerElement({ map: gmp.map, position: { lat: p.lat, lng: p.lng }, content: el, gmpClickable: true });
      marker.addEventListener('gmp-click', () => {
        gmp.lastPinClick = Date.now();
        selectPlace(p.id);
      });
      pin = { id: p.id, marker, el };
      gmp.pins.set(p.id, pin);
    }
    const r = reading(p);
    pin.marker.map = gmp.map;
    pin.marker.position = { lat: p.lat, lng: p.lng };
    pin.marker.title = `${p.name}: ${r?.aqi ?? '…'} AQI`;
    pin.marker.zIndex = p.id === state.selectedId ? 1000 : 100 + (r?.aqi ?? 0);
    pin.el.classList.toggle('active', p.id === state.selectedId);
    pin.el.querySelector('.bubble').style.background = aqiColor(r?.aqi);
    pin.el.querySelector('b').textContent = markerValue(r);
    pin.el.querySelector('.pin-label').textContent = p.name;
  }
}

function createFireMarkers() {
  gmp.fireMarkers = hotspots.map((h, i) => {
    const el = document.createElement('i');
    el.className = 'fire-dot gm';
    el.style.animationDelay = `${(i % 7) * 0.25}s`;
    return new gmp.AdvancedMarkerElement({ map: firesVisible() ? gmp.map : null, position: { lat: h.lat, lng: h.lng }, content: el, zIndex: 1, title: `Hotspot · ${h.cluster} (illustrative)` });
  });
}

// Smooth "fly to" with a zoom-out arc, tilt and heading (vector maps only).
function flyTo({ lat, lng, zoom, tilt = 0, heading = 0, ms = 2400 }) {
  if (state.view === '3d' && view3d.el) {
    gmp.flyToken++;
    view3d.el.stopCameraAnimation?.();
    view3d.el.flyCameraTo({
      endCamera: { center: { lat, lng, altitude: 0 }, range: zoomToRange(zoom), tilt: Math.max(tilt, 30), heading },
      durationMillis: ms,
    });
    return wait(ms);
  }
  const map = gmp.map;
  if (!map) return Promise.resolve();
  const c = map.getCenter();
  const from = { lat: c.lat(), lng: c.lng(), zoom: map.getZoom(), tilt: map.getTilt() || 0, heading: map.getHeading() || 0 };
  const arc = Math.min(2.2, Math.hypot(lat - from.lat, lng - from.lng) / 3);
  const token = ++gmp.flyToken;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) ms = 1;
  return new Promise(resolve => {
    const t0 = performance.now();
    const step = now => {
      if (token !== gmp.flyToken) return resolve();
      const t = Math.min(1, (now - t0) / ms);
      const e = ease(t);
      map.moveCamera({
        center: { lat: lerp(from.lat, lat, e), lng: lerp(from.lng, lng, e) },
        zoom: lerp(from.zoom, zoom, e) - arc * Math.sin(Math.PI * t),
        tilt: lerp(from.tilt, tilt, e),
        heading: lerp(from.heading, heading, e),
      });
      t < 1 ? requestAnimationFrame(step) : resolve();
    };
    requestAnimationFrame(step);
  });
}

// ---------------------------------------------------------------------------
// Views: 2D (vector roadmap) · Satellite (hybrid imagery) · 3D (Photorealistic 3D Maps)
// ---------------------------------------------------------------------------

const VIEWS = ['2d', '3d', 'satellite'];

async function setView(view) {
  if (view === state.view) return;
  const prev = state.view;
  state.view = view;
  try { localStorage.setItem('hazewatch_view', view); } catch {}
  renderView();
  if (!gmp.map) return; // demo mode: CSS handles tilt / satellite styling

  if (view === '3d') {
    if (await enter3D()) return renderAll();
    // 3D unavailable: fall back to a tilted vector map.
    state.view = '2d';
    renderView();
    gmp.map.setMapTypeId('roadmap');
    const c = gmp.map.getCenter();
    flyTo({ lat: c.lat(), lng: c.lng(), zoom: Math.max(gmp.map.getZoom(), 7), tilt: 60, heading: 20, ms: 1500 });
    return;
  }
  if (prev === '3d') exit3D();
  gmp.map.setMapTypeId(view === 'satellite' ? 'hybrid' : 'roadmap');
  renderAll();
}

function renderView() {
  $$('#viewSwitch button').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  const stage = $('#mapStage');
  VIEWS.forEach(v => stage.classList.toggle(`view-${v}`, v === state.view));
  renderLegend();
}

async function enter3D() {
  try {
    if (!view3d.lib) {
      view3d.lib = await track('GET', 'Maps JavaScript API · maps3d library', () => google.maps.importLibrary('maps3d'));
    }
    const c = gmp.map.getCenter();
    const camera = { center: { lat: c.lat(), lng: c.lng(), altitude: 0 }, range: zoomToRange(gmp.map.getZoom()), tilt: 55, heading: gmp.map.getHeading() || 0 };
    if (!view3d.el) {
      const { Map3DElement, MapMode } = view3d.lib;
      // First entry: start from orbit, then fly down onto the region.
      const b = filterBounds();
      const target = { center: { lat: (b.s + b.n) / 2, lng: (b.w + b.e) / 2, altitude: 0 }, range: rangeForBounds(b), tilt: 35, heading: 0 };
      const intro = { center: target.center, range: 2.2e7, tilt: 0, heading: 0 };
      view3d.el = new Map3DElement({ ...intro, defaultUIHidden: true, ...(MapMode ? { mode: MapMode.HYBRID } : {}) });
      view3d.el.className = 'map3d';
      $('#googleMap').after(view3d.el);
      view3d.el.addEventListener('gmp-error', () => toast('Photorealistic 3D failed to load — is the Map Tiles API enabled for this key?'));
      setTimeout(() => {
        view3d.el.flyCameraTo({ endCamera: target, durationMillis: 4500 });
        view3d.introDone = true;
      }, 600);
      view3d.el.addEventListener('gmp-click', e => {
        if (state.touring || Date.now() - gmp.lastPinClick < 400 || !e.position) return;
        probe(e.position.lat, e.position.lng);
      });
      // Hide the AQI columns when the camera is close enough to see buildings.
      view3d.el.addEventListener('gmp-rangechange', () => setColumnsShown(view3d.el.range > 120000));
      createFire3D();
    } else {
      view3d.el.stopCameraAnimation?.();
      Object.assign(view3d.el, camera);
    }
    try { localStorage.setItem('hazewatch_view', '3d'); } catch {}
    view3d.el.hidden = false;
    $('#googleMap').style.display = 'none';
    sync3d();
    syncZones3d();
    return true;
  } catch (err) {
    console.error(err);
    toast('Photorealistic 3D is unavailable for this key — showing a tilted vector map instead');
    return false;
  }
}

function exit3D() {
  const el = view3d.el;
  if (!el) return;
  el.stopCameraAnimation?.();
  const c = el.center;
  $('#googleMap').style.display = 'block';
  el.hidden = true;
  gmp.map.moveCamera({ center: { lat: c.lat, lng: c.lng }, zoom: Math.max(2, Math.min(16, rangeToZoom(el.range))), tilt: 0, heading: 0 });
}

function circle(lat, lng, km, altitude) {
  const dLat = km / 111.32, dLng = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    return { lat: lat + dLat * Math.sin(a), lng: lng + dLng * Math.cos(a), altitude };
  });
}

// `path` replaced the deprecated `outerCoordinates` on Polygon3DElement.
function setPath(polygon, coords) {
  if ('path' in polygon) polygon.path = coords;
  else polygon.outerCoordinates = coords;
}

// Camera range (metres) that frames a lat/lng box.
function rangeForBounds(b) {
  const midLat = ((b.s + b.n) / 2) * (Math.PI / 180);
  const wKm = (b.e - b.w) * 111.32 * Math.cos(midLat), hKm = (b.n - b.s) * 111.32;
  return Math.max(4000, Math.min(2.2e7, (Math.max(wKm, hKm * 1.5) * 1000) / 0.62));
}

// Fly down into a city and slowly orbit it.
async function fly3dCity(p, { orbit = true } = {}) {
  const el = view3d.el;
  if (!el) return;
  const camera = { center: { lat: p.lat, lng: p.lng, altitude: 0 }, ...CITY_CAMERA };
  el.stopCameraAnimation?.();
  el.flyCameraTo({ endCamera: camera, durationMillis: 3500 });
  if (!orbit) return wait(3500);
  const token = ++gmp.flyToken; // cancels any orbit queued by an earlier fly-in
  el.addEventListener('gmp-animationend', () => {
    if (token === gmp.flyToken && state.view === '3d') el.flyCameraAround({ camera, durationMillis: 40000, repeatCount: 1 });
  }, { once: true });
  return wait(3500);
}

function setColumnsShown(show) {
  if (show === view3d.columnsShown) return;
  view3d.columnsShown = show;
  view3d.objs.forEach((o, id) => (show && inFilter(placeById(id)) ? view3d.el.append(o.column) : o.column.remove()));
  sync3d();
}

// One extruded column per city: height and colour encode US AQI.
function sync3d() {
  if (!view3d.el || !view3d.lib) return;
  const { Polygon3DElement, Marker3DInteractiveElement, Marker3DElement } = view3d.lib;
  for (const [id, o] of view3d.objs) {
    if (!placeById(id)) {
      o.column.remove();
      o.marker.remove();
      view3d.objs.delete(id);
    }
  }
  for (const p of places) {
    let o = view3d.objs.get(p.id);
    if (!o) {
      const column = new Polygon3DElement({ altitudeMode: 'RELATIVE_TO_GROUND', extruded: true, strokeColor: 'rgba(255,255,255,0.7)', strokeWidth: 1 });
      const marker = new (Marker3DInteractiveElement || Marker3DElement)({ altitudeMode: 'RELATIVE_TO_GROUND', extruded: true });
      marker.addEventListener('gmp-click', () => {
        gmp.lastPinClick = Date.now();
        selectPlace(p.id);
      });
      let pin = null;
      try {
        pin = new gmp.PinElement({ borderColor: '#ffffff', glyphColor: '#ffffff' });
        marker.append(pin);
      } catch {}
      if (view3d.columnsShown) view3d.el.append(column);
      view3d.el.append(marker);
      o = { column, marker, pin };
      view3d.objs.set(p.id, o);
    }
    if (!inFilter(p)) {
      o.column.remove();
      o.marker.remove();
      continue;
    }
    if (!o.marker.isConnected) view3d.el.append(o.marker);
    if (view3d.columnsShown && !o.column.isConnected) view3d.el.append(o.column);
    const r = reading(p);
    const height = 4000 + (r?.aqi ?? 0) * 450;
    const color = aqiColor(r?.aqi);
    setPath(o.column, circle(p.lat, p.lng, p.id === state.selectedId ? 20 : 15, height));
    o.column.fillColor = rgba(color, p.id === state.selectedId ? 0.85 : 0.7);
    // Regional view: pin floats above its column. City view: pin sits just above the rooftops.
    o.marker.position = { lat: p.lat, lng: p.lng, altitude: view3d.columnsShown ? height + 3000 : 450 };
    o.marker.label = `${p.name} · ${markerValue(r)}`;
    if (o.pin) o.pin.background = color;
  }
  syncHaze3d();
}

// City view: a translucent haze layer over the selected city, coloured by AQI,
// thicker when the air is worse.
function syncHaze3d() {
  const p = placeById(state.selectedId);
  if (!view3d.haze) {
    view3d.haze = new view3d.lib.Polygon3DElement({ altitudeMode: 'RELATIVE_TO_GROUND', extruded: true, strokeWidth: 0, strokeColor: 'rgba(0,0,0,0)' });
  }
  if (view3d.columnsShown || !p || !inFilter(p)) return view3d.haze.remove();
  const aqi = reading(p)?.aqi ?? 0;
  setPath(view3d.haze, circle(p.lat, p.lng, 9, 250 + aqi * 4));
  view3d.haze.fillColor = rgba(aqiColor(aqi), Math.min(0.42, 0.12 + aqi / 600));
  if (!view3d.haze.isConnected) view3d.el.append(view3d.haze);
}

function createFire3D() {
  const { Polygon3DElement } = view3d.lib;
  view3d.fires = hotspots.map(h => new Polygon3DElement({
    altitudeMode: 'RELATIVE_TO_GROUND',
    extruded: true,
    fillColor: 'rgba(255,90,31,0.85)',
    strokeColor: 'rgba(255,200,120,0.9)',
    strokeWidth: 1,
  }));
  view3d.fires.forEach((f, i) => setPath(f, circle(hotspots[i].lat, hotspots[i].lng, 3, 9000)));
  if (firesVisible()) view3d.fires.forEach(f => view3d.el.append(f));
}

// Show every location: expand the list and frame all of them on the map.
function showAll({ expand = true } = {}) {
  if (expand) state.watchAll = true;
  renderWatch();
  const fixed = watched();
  const b = filterBounds();
  if (state.view === '3d' && view3d.el) {
    return flyTo({ lat: (b.s + b.n) / 2, lng: (b.w + b.e) / 2, zoom: rangeToZoom(rangeForBounds(b)), tilt: 35, ms: 2500 });
  }
  if (gmp.map) {
    const bounds = new google.maps.LatLngBounds();
    fixed.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
    gmp.map.moveCamera({ tilt: 0, heading: 0 });
    gmp.map.fitBounds(bounds, { top: 80, bottom: 140, left: 40, right: 300 });
    return;
  }
  fitDemo();
  renderDemoMap();
  toast(`Showing all ${fixed.length} locations`);
}

// ---------------------------------------------------------------------------
// Country filter (multi-select)
// ---------------------------------------------------------------------------

function filterLabel() {
  const sel = [...state.countries];
  if (!sel.length) return 'Asia-Pacific';
  const group = REGION_GROUPS.find(g => g.countries.length === sel.length && g.countries.every(c => state.countries.has(c)));
  if (group) return group.name;
  return sel.length === 1 ? sel[0] : `${sel.length} countries`;
}

function setCountries(countries, { fit = true } = {}) {
  state.countries = new Set(countries);
  try { localStorage.setItem('hazewatch_countries', JSON.stringify([...state.countries])); } catch {}
  if (!inFilter(placeById(state.selectedId) || {})) {
    const worst = watched().sort((a, b) => (reading(b)?.aqi ?? 0) - (reading(a)?.aqi ?? 0))[0];
    if (worst) state.selectedId = worst.id;
  }
  renderCountryFilter();
  syncFires();
  updateWindFromData();
  renderAll();
  if (demo.k) renderDemoMap();
  if (fit) showAll({ expand: false });
  if (gmp.map) refreshLive({ quiet: true, onlyMissing: true });
}

function renderCountryFilter() {
  const counts = {};
  places.forEach(p => !p.custom && (counts[p.country] = (counts[p.country] || 0) + 1));
  const flagOf = c => Object.keys(FLAG_COUNTRY).find(f => FLAG_COUNTRY[f] === c);
  const sel = state.countries;
  $('#countrySummary').textContent = sel.size ? `${filterLabel()} · ${watched().length} cities` : `All countries · ${watched().length} cities`;
  $('#countryChips').innerHTML = [...sel].map(c => `<button data-country="${esc(c)}" aria-label="Remove ${esc(c)}">${flagOf(c)} ${esc(c)} <i>×</i></button>`).join('');
  $$('#countryChips button').forEach(b => (b.onclick = () => {
    const next = new Set(sel);
    next.delete(b.dataset.country);
    setCountries(next);
  }));

  $('#countryMenu').innerHTML = `
    <div class="cm-actions"><button data-act="all">All countries</button><button data-act="clear">Clear</button></div>
    ${REGION_GROUPS.map((g, gi) => {
      const n = g.countries.filter(c => sel.has(c)).length;
      return `<div class="cm-group">
        <label class="cm-head"><input type="checkbox" data-group="${gi}" ${n === g.countries.length ? 'checked' : ''} ${n && n < g.countries.length ? 'data-mixed' : ''}/> ${g.name}</label>
        ${g.countries.map(c => `<label class="cm-row"><input type="checkbox" data-country="${esc(c)}" ${sel.has(c) ? 'checked' : ''}/><span>${flagOf(c)} ${esc(c)}</span><small>${counts[c] || 0}</small></label>`).join('')}
      </div>`;
    }).join('')}`;
  $$('#countryMenu input[data-mixed]').forEach(i => (i.indeterminate = true));
  $$('#countryMenu input[data-country]').forEach(i => (i.onchange = () => {
    const next = new Set(state.countries);
    i.checked ? next.add(i.dataset.country) : next.delete(i.dataset.country);
    setCountries(next);
  }));
  $$('#countryMenu input[data-group]').forEach(i => (i.onchange = () => {
    const next = new Set(state.countries);
    REGION_GROUPS[i.dataset.group].countries.forEach(c => (i.checked ? next.add(c) : next.delete(c)));
    setCountries(next);
  }));
  $$('#countryMenu [data-act]').forEach(b => (b.onclick = () => setCountries([])));
}

// ---------------------------------------------------------------------------
// AI chat (Gemini via server.mjs) → serious areas drawn as polygons
// ---------------------------------------------------------------------------

const SEVERITY = {
  sensitive: { label: 'Sensitive groups', min: 101 },
  unhealthy: { label: 'Unhealthy', min: 151 },
  very_unhealthy: { label: 'Very unhealthy', min: 201 },
  hazardous: { label: 'Hazardous', min: 301 },
};
const severityFor = aqi => (aqi > 300 ? 'hazardous' : aqi > 200 ? 'very_unhealthy' : aqi > 150 ? 'unhealthy' : 'sensitive');
const zone = { gm: [], gm3d: [] };

const distKm = (a, b) => {
  const x = (b.lng - a.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.hypot(x, b.lat - a.lat) * 111.32;
};

// Snapshot of the data the AI is allowed to use.
function aiContext() {
  const at = h => (p => reading(p, h)?.aqi ?? null);
  return {
    now: new Date().toISOString(),
    hourShownOnMap: state.hour,
    countryFilter: state.countries.size ? [...state.countries] : 'all',
    dataSource: isLive() ? 'live (Google Air Quality + Weather APIs)' : 'demo',
    cities: watched().map(p => {
      const r = reading(p, 0);
      return {
        id: p.id, name: p.name, region: p.meta, country: p.country,
        aqiNow: r?.aqi ?? null, pm25Now: r ? +r.pm.toFixed(1) : null,
        aqi12h: at(12)(p), aqi24h: at(24)(p), aqi48h: at(48)(p),
        wind: r?.windDeg != null ? `${compass(r.windDeg)} ${r.windKmh} km/h` : null,
      };
    }),
    fireHotspotClusters: firesVisible() ? fireClusters.map(c => ({ name: c.name, country: FIRE_COUNTRY, count: c.n, note: 'illustrative' })) : [],
  };
}

// --- Geometry: a smooth hull around each area's cities (+ nearby hotspots) ---

function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = list => {
    const out = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out.at(-2), out.at(-1), p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(pts), ...half([...pts].reverse())];
}

function chaikin(ring, rounds = 2) {
  for (let r = 0; r < rounds; r++) {
    ring = ring.flatMap((p, i) => {
      const q = ring[(i + 1) % ring.length];
      return [[0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]];
    });
  }
  return ring;
}

// Split far-apart cities into separate blobs, then hull each one. Rings are [lng, lat].
function zoneRings(cities) {
  const groups = [];
  for (const c of cities) {
    const g = groups.find(g => g.some(o => distKm(o, c) < 700));
    g ? g.push(c) : groups.push([c]);
  }
  return groups.map(group => {
    const fires = firesVisible() ? hotspots.filter(h => group.some(c => distKm(c, h) < 230)) : [];
    const pts = [];
    for (const [pt, km] of [...group.map(c => [c, 115]), ...fires.map(h => [h, 55])]) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        pts.push([pt.lng + (km / (111.32 * Math.cos((pt.lat * Math.PI) / 180))) * Math.cos(a), pt.lat + (km / 111.32) * Math.sin(a)]);
      }
    }
    return chaikin(convexHull(pts), 2);
  });
}

function buildZones(areas, hour) {
  return areas.map(a => {
    const cities = a.cityIds.map(placeById).filter(p => p && !p.custom);
    if (!cities.length) return null;
    const peak = Math.max(...cities.map(p => reading(p, hour)?.aqi ?? 0));
    const rings = zoneRings(cities);
    const all = rings.flat();
    return {
      name: a.name,
      reason: a.reason,
      severity: SEVERITY[a.severity] ? a.severity : severityFor(peak),
      peak,
      color: aqiColor(peak),
      cityIds: cities.map(p => p.id),
      rings,
      center: { lng: all.reduce((s, p) => s + p[0], 0) / all.length, lat: all.reduce((s, p) => s + p[1], 0) / all.length },
    };
  }).filter(Boolean);
}

// --- Drawing on every map type ---

function demoZonesSvg() {
  if (!state.aiZones.length) return '';
  const paths = state.aiZones.map(z => z.rings.map(ring => {
    const d = ring.map(([lng, lat], i) => {
      const [x, y] = project(lat, lng);
      return (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join('') + 'Z';
    return `<path class="ai-zone" d="${d}" style="fill:${z.color};stroke:${z.color}"/>`;
  }).join('')).join('');
  const labels = state.aiZones.map(z => {
    const [x, y] = project(z.center.lat, z.center.lng);
    return `<text class="zone-label" x="${x.toFixed(1)}" y="${(y - 46).toFixed(1)}" style="fill:${z.color}">${esc(z.name)}</text>`;
  }).join('');
  return paths + labels;
}

function clearGoogleZones() {
  zone.gm.forEach(o => (o.setMap ? o.setMap(null) : (o.map = null)));
  zone.gm3d.forEach(o => o.remove());
  zone.gm = [];
  zone.gm3d = [];
}

function syncZonesGoogle() {
  clearGoogleZones();
  if (!gmp.map) return;
  for (const z of state.aiZones) {
    for (const ring of z.rings) {
      zone.gm.push(new google.maps.Polygon({
        map: gmp.map,
        paths: ring.map(([lng, lat]) => ({ lat, lng })),
        strokeColor: z.color, strokeWeight: 2.5, strokeOpacity: 0.95,
        fillColor: z.color, fillOpacity: 0.22, clickable: false, zIndex: 5,
      }));
    }
    const label = document.createElement('div');
    label.className = 'zone-label-gm';
    label.style.background = z.color;
    label.textContent = `${z.name} · AQI ${z.peak}`;
    zone.gm.push(new gmp.AdvancedMarkerElement({ map: gmp.map, position: z.center, content: label, zIndex: 900 }));
  }
  syncZones3d();
}

function syncZones3d() {
  zone.gm3d.forEach(o => o.remove());
  zone.gm3d = [];
  if (!view3d.el || !view3d.lib) return;
  const { Polygon3DElement, Marker3DElement } = view3d.lib;
  for (const z of state.aiZones) {
    for (const ring of z.rings) {
      const poly = new Polygon3DElement({
        altitudeMode: 'RELATIVE_TO_GROUND', extruded: true,
        fillColor: rgba(z.color, 0.28), strokeColor: rgba(z.color, 0.95), strokeWidth: 3,
      });
      setPath(poly, ring.map(([lng, lat]) => ({ lat, lng, altitude: 1500 })));
      view3d.el.append(poly);
      zone.gm3d.push(poly);
    }
    const label = new Marker3DElement({ position: { ...z.center, altitude: 30000 }, altitudeMode: 'RELATIVE_TO_GROUND', label: `${z.name} · AQI ${z.peak}` });
    view3d.el.append(label);
    zone.gm3d.push(label);
  }
}

function renderZones() {
  syncZonesGoogle();
  if (demo.k) renderDemoMap();
}

function zonesBounds(zones) {
  const pts = zones.flatMap(z => z.rings.flat());
  const lngs = pts.map(p => p[0]), lats = pts.map(p => p[1]);
  return { w: Math.min(...lngs) - 1, e: Math.max(...lngs) + 1, s: Math.min(...lats) - 1, n: Math.max(...lats) + 1 };
}

function fitZones(zones) {
  if (!zones.length) return;
  const b = zonesBounds(zones);
  if (state.view === '3d' && view3d.el) {
    return flyTo({ lat: (b.s + b.n) / 2, lng: (b.w + b.e) / 2, zoom: rangeToZoom(rangeForBounds(b)), tilt: 40, ms: 2500 });
  }
  if (gmp.map) {
    gmp.map.moveCamera({ tilt: 0, heading: 0 });
    gmp.map.fitBounds({ west: b.w, east: b.e, south: b.s, north: b.n }, { top: 90, bottom: 140, left: 440, right: 300 });
    return;
  }
  fitDemo(b);
  renderDemoMap();
}

// --- Offline fallback: rule-based grouping when no Gemini key is configured ---

function offlineAnalysis(question) {
  const q = question.toLowerCase();
  const hour = /48|two days|day after/.test(q) ? 48 : /24|tomorrow/.test(q) ? 24 : /12|tonight|later/.test(q) ? 12 : 0;
  const scored = watched().map(p => ({ p, aqi: reading(p, hour)?.aqi ?? 0 }));
  let serious = scored.filter(x => x.aqi > 150);
  if (!serious.length) serious = scored.filter(x => x.aqi > 100);
  const groups = [];
  for (const x of serious.sort((a, b) => b.aqi - a.aqi)) {
    const g = groups.find(g => g.some(o => distKm(o.p, x.p) < 450));
    g ? g.push(x) : groups.push([x]);
  }
  const areas = groups.map(g => {
    const regions = [...new Set(g.map(x => x.p.meta.split(',')[0].trim()))];
    const peak = Math.max(...g.map(x => x.aqi));
    return {
      name: regions.slice(0, 2).join(' & '),
      cityIds: g.map(x => x.p.id),
      severity: severityFor(peak),
      reason: `${g.map(x => `${x.p.name} ${x.aqi}`).join(', ')} US AQI`,
    };
  });
  const when = hour ? `in ${hour} hours` : 'right now';
  const answer = areas.length
    ? `${areas.length} area${areas.length > 1 ? 's are' : ' is'} serious ${when}: ${areas.map(a => a.name).join('; ')}. People there should limit outdoor activity and wear a well-fitted N95 mask outdoors; sensitive groups should stay indoors.`
    : `No watched city is above AQI 100 ${when}. Air quality is acceptable for most people.`;
  return { answer, focusHour: hour, areas, model: 'offline rule-based analysis' };
}

// --- Chat UI ---

function aiMessage(cls, html) {
  const li = document.createElement('li');
  li.className = `ai-msg ${cls}`;
  li.innerHTML = html;
  $('#aiMessages').append(li);
  $('#aiMessages').scrollTop = $('#aiMessages').scrollHeight;
  return li;
}

const THINKING_STEPS = ['Reading live air quality…', 'Checking forecast and wind…', 'Finding serious areas…'];
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// "Thinking" bubble: pulsing spark + shimmering status text that cycles through steps.
function showThinking() {
  const li = aiMessage('model ai-thinking', `<span class="ai-spark">✦</span><span class="ai-think-text">${THINKING_STEPS[0]}</span>`);
  let i = 0;
  const timer = setInterval(() => {
    i = Math.min(i + 1, THINKING_STEPS.length - 1);
    const t = li.querySelector('.ai-think-text');
    t.textContent = THINKING_STEPS[i];
    t.style.animation = 'none';
    void t.offsetWidth; // restart the fade-in
    t.style.animation = '';
  }, 1300);
  return { done: () => { clearInterval(timer); li.remove(); } };
}

// Reveal text word by word, like a streamed response.
async function typeOut(el, text) {
  if (reducedMotion()) return (el.textContent = text);
  const words = text.split(/(\s+)/);
  el.classList.add('typing');
  for (let i = 0; i < words.length; i++) {
    el.textContent += words[i];
    if (words[i].trim()) await wait(28);
    $('#aiMessages').scrollTop = $('#aiMessages').scrollHeight;
  }
  el.classList.remove('typing');
}

async function askAI(question) {
  question = question.trim();
  if (!question || state.aiBusy) return;
  state.aiBusy = true;
  $('#aiForm button').disabled = true;
  $('#aiSuggest').hidden = true;
  aiMessage('user', esc(question));
  const thinking = showThinking();
  const minThink = wait(1400); // keep the thinking state visible even when the answer is instant

  let result;
  try {
    result = await track('POST', `AI · Gemini generateContent · "${question.slice(0, 40)}"`, async () => {
      const res = await fetch('api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history: state.aiHistory, context: aiContext() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 503 || res.status === 404 || res.status === 501) return Object.assign(offlineAnalysis(question), { __status: 'offline' });
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      return Object.assign(json, { __status: res.status });
    });
  } catch (err) {
    // Server not running (e.g. plain static hosting) → offline analysis.
    result = err instanceof TypeError ? offlineAnalysis(question) : null;
    if (!result) {
      await minThink;
      thinking.done();
      aiMessage('model error', `Sorry, the AI request failed: ${esc(err.message)}`);
      state.aiBusy = false;
      $('#aiForm button').disabled = false;
      return;
    }
  }
  await minThink;
  thinking.done();

  const hour = [0, 12, 24, 48].includes(result.focusHour) ? result.focusHour : 0;
  const zones = buildZones(Array.isArray(result.areas) ? result.areas : [], hour);

  // 1) type the answer, 2) fade in area cards, 3) draw the zones on the map.
  const li = aiMessage('model', '<span class="ai-text"></span>');
  await typeOut(li.querySelector('.ai-text'), result.answer || '');

  if (hour !== state.hour) updateForecast(hour);
  state.aiZones = zones;
  renderZones();
  fitZones(state.aiZones);

  const areasHtml = zones.length ? `<div class="ai-areas">${zones.map((z, i) => `
    <button class="ai-area" data-zone="${i}" style="animation-delay:${i * 120}ms"><i style="background:${z.color}"></i><span><b>${esc(z.name)}</b><small>${esc(z.reason || '')}</small></span><em style="background:${z.color}">${z.peak}</em></button>`).join('')}</div>` : '';
  const meta = `<span class="ai-meta">${esc(result.model || 'Gemini')}${hour ? ` · forecast +${hour}h` : ''}${isLive() ? '' : ' · demo data'}</span>`;
  li.insertAdjacentHTML('beforeend', areasHtml + meta);
  $('#aiMessages').scrollTop = $('#aiMessages').scrollHeight;
  li.querySelectorAll('[data-zone]').forEach(b => (b.onclick = () => {
    const z = state.aiZones[Number(b.dataset.zone)];
    if (!z) return;
    const worst = z.cityIds.map(placeById).sort((a, b) => (reading(b)?.aqi ?? 0) - (reading(a)?.aqi ?? 0))[0];
    if (worst) selectPlace(worst.id, { fly: false });
    fitZones([z]);
  }));
  $('#aiModel').textContent = `${result.model || 'Gemini'} · ${isLive() ? 'live' : 'demo'} air-quality data`;

  state.aiHistory.push({ role: 'user', text: question }, { role: 'model', text: result.answer || '' });
  state.aiHistory = state.aiHistory.slice(-6);
  state.aiBusy = false;
  $('#aiForm button').disabled = false;
}

function toggleAI(open = $('#aiPanel').hidden) {
  $('#aiPanel').hidden = !open;
  $('#aiBtn').classList.toggle('active', open);
  if (open) setTimeout(() => $('#aiInput').focus(), 50);
}

function clearAI() {
  state.aiZones = [];
  state.aiHistory = [];
  renderZones();
  $('#aiMessages').innerHTML = '<li class="ai-msg model intro">Ask me about the haze. I\'ll explain which areas are serious and outline them on the map.</li>';
  $('#aiSuggest').hidden = false;
}

// ---------------------------------------------------------------------------
// Wind particles (screen-space flow driven by live or demo wind direction)
// ---------------------------------------------------------------------------

const wind = { canvas: null, ctx: null, w: 0, h: 0, dpr: 1, particles: [], deg: 220, kmh: 10, running: false, t: 0 };

function setupWind() {
  wind.canvas = $('#windCanvas');
  wind.ctx = wind.canvas.getContext('2d');
  const resize = () => {
    const r = wind.canvas.getBoundingClientRect();
    wind.dpr = Math.min(2, window.devicePixelRatio || 1);
    wind.w = wind.canvas.width = Math.round(r.width * wind.dpr);
    wind.h = wind.canvas.height = Math.round(r.height * wind.dpr);
    const count = matchMedia('(prefers-reduced-motion: reduce)').matches ? 90 : Math.round((r.width * r.height) / 2600);
    wind.particles = Array.from({ length: Math.min(600, count) }, spawnParticle);
  };
  new ResizeObserver(resize).observe($('#mapStage'));
  resize();
  updateWindFromData();
  startWind();
}

function spawnParticle() {
  return { x: Math.random() * wind.w, y: Math.random() * wind.h, age: 0, life: 60 + Math.random() * 120 };
}

// Vector-average the wind across watched cities.
function updateWindFromData() {
  let x = 0, y = 0, speed = 0, n = 0;
  for (const p of watched()) {
    const r = reading(p, 0);
    if (r?.windDeg == null) continue;
    const rad = (r.windDeg * Math.PI) / 180;
    x += Math.sin(rad); y += Math.cos(rad); speed += r.windKmh; n++;
  }
  if (!n) return;
  wind.deg = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
  wind.kmh = speed / n;
}

function startWind() {
  if (!wind.ctx) return;
  if (!state.showWind) {
    wind.ctx.clearRect(0, 0, wind.w, wind.h);
    return;
  }
  if (wind.running) return;
  wind.running = true;
  requestAnimationFrame(tickWind);
}

function tickWind() {
  const { ctx, w, h, dpr } = wind;
  if (!state.showWind) {
    wind.running = false;
    ctx.clearRect(0, 0, w, h);
    return;
  }
  wind.t += 0.004;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = state.view === 'satellite' || (isLive() && state.view === '3d') ? 'rgba(255,255,255,0.6)' : isLive() ? 'rgba(20,55,45,0.6)' : 'rgba(30,72,60,0.55)';
  ctx.lineWidth = 1.3 * dpr;
  ctx.lineCap = 'round';
  ctx.beginPath();

  // Wind blows FROM deg, so particles travel toward deg + 180.
  const base = ((wind.deg + 180) * Math.PI) / 180;
  const speed = (0.5 + wind.kmh * 0.07) * dpr;
  for (const p of wind.particles) {
    const swirl = Math.sin(p.x * 0.0035 / dpr + wind.t * 3) * 0.35 + Math.cos(p.y * 0.004 / dpr - wind.t * 2) * 0.35;
    const a = base + swirl;
    const nx = p.x + Math.sin(a) * speed;
    const ny = p.y - Math.cos(a) * speed;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(nx, ny);
    p.x = nx; p.y = ny;
    if (++p.age > p.life || nx < 0 || ny < 0 || nx > w || ny > h) Object.assign(p, spawnParticle());
  }
  ctx.stroke();
  requestAnimationFrame(tickWind);
}

// ---------------------------------------------------------------------------
// Guided tour for presenting (press T)
// ---------------------------------------------------------------------------

const TOUR = [
  { caption: 'Southeast Asia · Air Quality API heatmap tiles over a vector map', view: '2d', camera: { ...SEA_VIEW }, layer: 'aqi', wind: false, fires: false, hour: 0 },
  { caption: 'Satellite view — peatland fire hotspots across Sumatra and Borneo', view: 'satellite', camera: { lat: -1, lng: 105.5, zoom: 6 }, fires: true },
  { caption: 'South-westerly winds push smoke across the Strait of Malacca', camera: { lat: 1.4, lng: 102.6, zoom: 6.8 }, wind: true },
  { caption: 'Pekanbaru, Riau — inside the hotspot cluster', select: 'pekanbaru', camera: { lat: 0.51, lng: 101.45, zoom: 9 } },
  { caption: 'Photorealistic 3D — column height and colour show US AQI', view: '3d', camera: { lat: -1.2, lng: 104.5, zoom: 5.6, tilt: 55, heading: 15 } },
  { caption: 'Singapore in Photorealistic 3D — the haze layer is coloured by live AQI', view: '3d', select: 'singapore', city: true },
  { caption: 'Switch to the PM₂.₅ concentration heatmap', view: '2d', layer: 'pm25', camera: { lat: 2, lng: 103.2, zoom: 7 } },
  { caption: 'Next 48 hours from forecast:lookup', layer: 'aqi', camera: { ...SEA_VIEW, zoom: 5.3 }, play: true },
  { caption: 'Try it: click anywhere on the map, or search any place in Asia-Pacific', view: '3d', camera: { ...SEA_VIEW, tilt: 35 } },
];

async function runTour() {
  if (state.touring) return stopTour();
  const token = ++state.tourToken;
  state.touring = true;
  $('#tourBtn').classList.add('active');
  $('#tourBtn span').textContent = 'Stop tour';
  closeSearch();
  togglePlay(false);
  if (state.countries.size) setCountries([], { fit: false });
  const alive = () => token === state.tourToken;

  for (let i = 0; i < TOUR.length && alive(); i++) {
    const s = TOUR[i];
    $('#tourCaption').hidden = false;
    $('#tourStep').textContent = `${i + 1}/${TOUR.length}`;
    $('#tourText').textContent = s.caption;
    if (s.view) await setView(s.view);
    if (s.hour != null) updateForecast(s.hour);
    if (s.layer && s.layer !== state.layer) setLayer(s.layer);
    if (s.wind != null) setWind(s.wind);
    if (s.fires != null) setFires(s.fires);
    if (s.select) selectPlace(s.select, { fly: false });
    if (gmp.map && s.city && view3d.el && state.view === '3d') {
      await fly3dCity(placeById(s.select));
      await wait(5000);
    } else if (gmp.map && s.camera) await flyTo({ ms: 2600, ...s.camera });
    if (s.play) {
      for (const h of [12, 24, 48, 0]) {
        await wait(1500);
        if (!alive()) return;
        updateForecast(h);
      }
    }
    await wait(s.play ? 800 : 3200);
  }
  if (alive()) stopTour();
}

function stopTour() {
  state.tourToken++;
  state.touring = false;
  gmp.flyToken++;
  $('#tourCaption').hidden = true;
  $('#tourBtn').classList.remove('active');
  $('#tourBtn span').textContent = 'Demo tour';
}

// Shown over the offline map when Google Maps isn't available.
function showEnvNotice(msg) {
  $('#envNotice span').textContent = msg;
  $('#envNotice').hidden = false;
}

// ---------------------------------------------------------------------------
// Wire up
// ---------------------------------------------------------------------------

places.forEach(p => (p.pm ??= aqiToPm(p.aqi)));
try {
  const saved = JSON.parse(localStorage.getItem('hazewatch_countries') || '[]');
  state.countries = new Set(saved.filter(c => Object.values(FLAG_COUNTRY).includes(c)));
} catch {}
renderCountryFilter();
renderTimelineLabels();
updateForecast(0);
setupWind();
setupDemoMap();

$('#searchInput').addEventListener('input', e => renderSearch(e.target.value));
$('#searchInput').addEventListener('focus', e => e.target.value && renderSearch(e.target.value));
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap, #viewAllBtn')) $('#searchResults').hidden = true;
});

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    $('#searchInput').focus();
    return;
  }
  if (e.key === 'Escape') {
    closeSearch();
    $('#countryMenu').hidden = true;
    toggleSidebar(false);
    if (state.touring) stopTour();
    return;
  }
  if (e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const actions = {
    t: runTour,
    ' ': () => togglePlay(),
    1: () => setLayer('aqi'),
    2: () => setLayer('pm25'),
    w: () => setWind(!state.showWind),
    f: () => setFires(!state.showFires),
    i: () => ($('#apiPanel').hidden = !$('#apiPanel').hidden),
    g: () => (gmp.map ? flyTo({ ...SEA_VIEW, ms: 1800 }) : null),
    c: () => $('#countryBtn').click(),
    '/': () => toggleAI(true),
    r: () => toggleSidebar(),
    a: () => showAll(),
    v: () => setView(VIEWS[(VIEWS.indexOf(state.view) + 1) % VIEWS.length]),
    '?': () => toast('T tour · Space play · / Ask AI · R region info · V 2D/3D/Satellite · A all locations · C countries · 1 AQI · 2 PM₂.₅ · W wind · F hotspots · I inspector · G overview · ⌘K search'),
  };
  const action = actions[e.key.toLowerCase()];
  if (action) {
    e.preventDefault();
    action();
  }
});

$$('.tool[data-layer]').forEach(b => (b.onclick = () => {
  const l = b.dataset.layer;
  if (l === 'wind') setWind(!state.showWind);
  else if (l === 'fires') setFires(!state.showFires);
  else setLayer(l);
}));
$('#legendBtn').onclick = () => ($('#legend').hidden = !$('#legend').hidden);

$$('#stepTabs button').forEach(b => (b.onclick = () => updateForecast(b.dataset.hour)));
$('#timelineTrack').onclick = e => {
  const r = e.currentTarget.getBoundingClientRect();
  const p = (e.clientX - r.left) / r.width;
  updateForecast(p < 0.18 ? 0 : p < 0.4 ? 12 : p < 0.72 ? 24 : 48);
};
$('#playBtn').onclick = () => togglePlay();

$('#zoomIn').onclick = () => setMapZoom(1);
$('#zoomOut').onclick = () => setMapZoom(-1);
$('#locateBtn').onclick = () => {
  if (!navigator.geolocation) return toast('Location is not supported');
  navigator.geolocation.getCurrentPosition(
    pos => {
      if (gmp.map) probe(pos.coords.latitude, pos.coords.longitude, { name: 'My location', zoom: 10 });
      else toast('Location found · connect Google Maps to see live air quality here');
    },
    () => toast('Location access was not available'),
  );
};

$('#mapStage').addEventListener('wheel', e => {
  if (gmp.map || e.target.closest('.map-toolbar,.map-controls,.timeline-panel,.detail-card,.legend,.api-panel,.view-switch')) return;
  e.preventDefault();
  const rect = $('#demoMap').getBoundingClientRect();
  zoomDemo(Math.exp(-Math.max(-120, Math.min(120, e.deltaY)) * 0.003), e.clientX - rect.left, e.clientY - rect.top);
}, { passive: false });
$('#demoMap').addEventListener('dblclick', e => {
  if (e.target.closest('.city-marker')) return;
  e.preventDefault();
  const rect = e.currentTarget.getBoundingClientRect();
  zoomDemo(1.6, e.clientX - rect.left, e.clientY - rect.top);
});

$('#envNotice button').onclick = () => ($('#envNotice').hidden = true);

// Regional information panel: hidden by default so the map fills the screen.
function toggleSidebar(open = !document.body.classList.contains('sidebar-open')) {
  document.body.classList.toggle('sidebar-open', open);
  $('#infoBtn').setAttribute('aria-expanded', open);
  $('#infoBtn').classList.toggle('active', open);
}
$('#infoBtn').onclick = () => toggleSidebar();
$('#sidebarClose').onclick = () => toggleSidebar(false);

$('#tourBtn').onclick = runTour;
$('#aiBtn').onclick = () => toggleAI();
$('#aiClose').onclick = () => toggleAI(false);
$('#aiClear').onclick = clearAI;
$('#aiForm').onsubmit = e => {
  e.preventDefault();
  const q = $('#aiInput').value;
  $('#aiInput').value = '';
  askAI(q);
};
$$('#aiSuggest button').forEach(b => (b.onclick = () => askAI(b.textContent)));
$('#apiClose').onclick = () => ($('#apiPanel').hidden = true);
$('#closeDetail').onclick = () => ($('#detailCard').hidden = true);
$('#alertBtn').onclick = () => toast(`Alert saved for ${placeById(state.selectedId)?.name} (prototype)`);
$('#notifyBtn').onclick = () => toast('No new regional alerts');
$('#viewAllBtn').onclick = () => {
  if (state.watchAll) {
    state.watchAll = false;
    renderWatch();
  } else showAll();
};
$('#fitBtn').onclick = () => showAll();
$('#countryBtn').onclick = e => {
  e.stopPropagation();
  const menu = $('#countryMenu');
  menu.hidden = !menu.hidden;
  $('#countryBtn').setAttribute('aria-expanded', !menu.hidden);
};
document.addEventListener('click', e => {
  if (!e.target.closest('.country-filter')) $('#countryMenu').hidden = true;
});
$$('#viewSwitch button').forEach(b => (b.onclick = () => setView(b.dataset.view)));
$('#healthDismiss').onclick = () => {
  state.healthDismissed = true;
  $('#healthCard').hidden = true;
};

// Start on Google Maps using GOOGLE_MAPS_API_KEY / GOOGLE_MAPS_MAP_ID from .env
// (served as /config.js by server.mjs). Add ?demo to the URL to force the offline map.
(() => {
  try {
    // Keys used to be saved in the browser; .env is now the only source.
    localStorage.removeItem('hazewatch_google_key');
    localStorage.removeItem('hazewatch_map_id');
  } catch {}
  const { googleMapsApiKey = '', mapId = '' } = window.HAZEWATCH_CONFIG || {};
  if (new URLSearchParams(location.search).has('demo')) return;
  if (googleMapsApiKey) connectGoogle(googleMapsApiKey, mapId);
  else showEnvNotice(window.HAZEWATCH_CONFIG
    ? 'No GOOGLE_MAPS_API_KEY in .env — showing the offline map.'
    : 'Start the app with npm run serve so it can read .env — showing the offline map.');
})();
