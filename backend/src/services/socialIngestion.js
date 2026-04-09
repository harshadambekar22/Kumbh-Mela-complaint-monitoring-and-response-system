const axios = require("axios");

const KEYWORDS = (process.env.SOCIAL_KEYWORDS || "nashik,kumbh,kumbhmela,kumbh mela")
  .split(",")
  .map((x) => x.trim().toLowerCase())
  .filter(Boolean);

let lastState = {
  xLastId: null,
  facebookSince: null,
  instagramSince: null,
  lastRunAt: null,
  fetched: 0,
  queued: 0,
  processed: 0,
  enabledProviders: [],
};

function containsKeywords(text) {
  const t = String(text || "").toLowerCase();
  return KEYWORDS.some((k) => t.includes(k));
}

async function fetchFromX() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];
  const query = encodeURIComponent(process.env.X_QUERY || "(nashik OR kumbh OR kumbhmela OR \"kumbh mela\") lang:en -is:retweet");
  const max = Number(process.env.X_MAX_RESULTS || 25);
  const sinceParam = lastState.xLastId ? `&since_id=${lastState.xLastId}` : "";
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=${max}${sinceParam}&tweet.fields=author_id,created_at,text`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  });
  const rows = (data?.data || []).map((t) => ({
    id: t.id,
    platform: "twitter",
    username: `x_user_${t.author_id || "unknown"}`,
    text: t.text,
    createdAt: t.created_at || new Date().toISOString(),
  }));
  if (rows.length) lastState.xLastId = rows[0].id;
  return rows.filter((r) => containsKeywords(r.text));
}

async function fetchFromFacebook() {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageIds = (process.env.FACEBOOK_PAGE_IDS || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!token || !pageIds.length) return [];

  const posts = [];
  for (const pageId of pageIds) {
    const sinceParam = lastState.facebookSince ? `&since=${encodeURIComponent(lastState.facebookSince)}` : "";
    const url = `https://graph.facebook.com/v21.0/${pageId}/posts?fields=message,created_time,from&access_token=${encodeURIComponent(token)}${sinceParam}`;
    try {
      const { data } = await axios.get(url, { timeout: 10000 });
      for (const p of data?.data || []) {
        const text = p.message || "";
        posts.push({
          id: p.id,
          platform: "facebook",
          username: p.from?.name || "facebook_user",
          text,
          createdAt: p.created_time || new Date().toISOString(),
        });
      }
    } catch (_e) {
      // ignore single page failure
    }
  }
  lastState.facebookSince = new Date().toISOString();
  return posts.filter((r) => r.text && containsKeywords(r.text));
}

async function fetchFromInstagram() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId = process.env.INSTAGRAM_BUSINESS_ID;
  if (!token || !businessId) return [];
  // Instagram hashtag/media search requires app review + permissions.
  // This reads account media captions for keyword-based capture.
  const sinceParam = lastState.instagramSince ? `&since=${encodeURIComponent(lastState.instagramSince)}` : "";
  const url = `https://graph.facebook.com/v21.0/${businessId}/media?fields=id,caption,timestamp,username&access_token=${encodeURIComponent(
    token
  )}${sinceParam}`;
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const rows = (data?.data || []).map((m) => ({
      id: m.id,
      platform: "instagram",
      username: m.username || "instagram_user",
      text: m.caption || "",
      createdAt: m.timestamp || new Date().toISOString(),
    }));
    lastState.instagramSince = new Date().toISOString();
    return rows.filter((r) => r.text && containsKeywords(r.text));
  } catch (_e) {
    return [];
  }
}

async function fetchAllProviders() {
  const providers = [];
  const all = [];

  const x = await fetchFromX();
  if (x.length || process.env.X_BEARER_TOKEN) providers.push("x");
  all.push(...x);

  const fb = await fetchFromFacebook();
  if (fb.length || process.env.FACEBOOK_ACCESS_TOKEN) providers.push("facebook");
  all.push(...fb);

  const ig = await fetchFromInstagram();
  if (ig.length || process.env.INSTAGRAM_ACCESS_TOKEN) providers.push("instagram");
  all.push(...ig);

  // dedupe by id+platform
  const seen = new Set();
  const deduped = all.filter((p) => {
    const k = `${p.platform}:${p.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  lastState.enabledProviders = providers;
  lastState.fetched = deduped.length;
  return deduped;
}

function updateRunState({ queued = 0, processed = 0 }) {
  lastState.lastRunAt = new Date().toISOString();
  lastState.queued = queued;
  lastState.processed = processed;
}

function getSocialState() {
  return lastState;
}

module.exports = {
  fetchAllProviders,
  updateRunState,
  getSocialState,
};
