const axios = require("axios");

function normalizeAiServiceUrl(raw) {
  const fallback = "http://127.0.0.1:8001";
  const u = String(raw || "").trim();
  if (!u) return fallback;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  // Render Blueprint may set host:port for private network (e.g. kumbh-ai-service:10000).
  return `http://${u}`;
}

const AI_SERVICE_URL = normalizeAiServiceUrl(process.env.AI_SERVICE_URL);

const CATEGORY_COORDS = {
  traffic: { lat: 19.9975, lng: 73.7898 },
  water: { lat: 19.9952, lng: 73.7911 },
  electricity: { lat: 20.0018, lng: 73.7842 },
  medical: { lat: 19.9992, lng: 73.7935 },
  lost_and_found: { lat: 19.9981, lng: 73.7877 },
  sanitation: { lat: 19.996, lng: 73.7952 },
};

const LOCATION_COORDS = {
  Panchavati: { lat: 20.0102, lng: 73.7987 },
  Ramkund: { lat: 20.0059, lng: 73.7924 },
  "main ghat": { lat: 20.0041, lng: 73.7931 },
  "sector B": { lat: 20.0022, lng: 73.7869 },
  "sector A": { lat: 20.0015, lng: 73.7881 },
  "tent city": { lat: 19.9925, lng: 73.7831 },
  Godavari: { lat: 20.0065, lng: 73.794 },
};

const CATEGORY_KEYWORDS = {
  traffic: ["traffic", "jam", "road blocked", "signal", "congestion"],
  water: ["water", "tap", "drinking water", "tanker", "supply cut"],
  electricity: ["power", "electricity", "outage", "blackout", "streetlights"],
  medical: ["medical", "doctor", "ambulance", "fainted", "health"],
  lost_and_found: ["lost", "missing", "stolen", "found", "child"],
  sanitation: ["garbage", "cleaning", "dustbin", "toilet", "waste"],
};

const DEPARTMENT_MAP = {
  traffic: "Police",
  water: "Water Department",
  electricity: "Electricity Board",
  medical: "Health Department",
  lost_and_found: "Security",
  sanitation: "Municipal Corporation",
};

function inferCategoryByKeywords(text) {
  const lowered = text.toLowerCase();
  const score = {};

  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    score[category] = words.reduce((acc, word) => (lowered.includes(word) ? acc + 1 : acc), 0);
  }

  const sorted = Object.entries(score).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : "sanitation";
}

function inferLocation(text) {
  const lowered = text.toLowerCase();
  const location = Object.keys(LOCATION_COORDS).find((loc) => lowered.includes(loc.toLowerCase()));
  return location || "Unknown";
}

function inferPriority(text) {
  const lowered = text.toLowerCase();
  const highTokens = ["urgent", "help", "stuck", "missing", "lost child", "ambulance", "outage", "blackout", "fainted"];
  const mediumTokens = ["delay", "not working", "not cleaned", "overflowing", "cut", "blocked"];
  if (highTokens.some((t) => lowered.includes(t))) return "high";
  if (mediumTokens.some((t) => lowered.includes(t))) return "medium";
  return "medium";
}

function fallbackAnalyze(text) {
  const category = inferCategoryByKeywords(text);
  const locationName = inferLocation(text);
  const priority = inferPriority(text);
  return {
    isComplaint: true,
    category,
    department: DEPARTMENT_MAP[category] || "General Administration",
    priority,
    locationName,
    confidence: 0.7,
    reviewRecommendation: "auto_approve",
  };
}

async function analyzeText(text) {
  try {
    const { data } = await axios.post(`${AI_SERVICE_URL}/analyze`, { text }, { timeout: 5000 });
    return data;
  } catch (_error) {
    return fallbackAnalyze(text);
  }
}

function resolveCoordinates(locationName, category) {
  const normalized = locationName?.trim();
  if (normalized && LOCATION_COORDS[normalized]) {
    return {
      latitude: LOCATION_COORDS[normalized].lat,
      longitude: LOCATION_COORDS[normalized].lng,
    };
  }

  const fallback = CATEGORY_COORDS[category] || { lat: 19.9975, lng: 73.7898 };
  return {
    latitude: fallback.lat,
    longitude: fallback.lng,
  };
}

module.exports = {
  analyzeText,
  resolveCoordinates,
};
