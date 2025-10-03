// services/wallhaven.js
const PROD_BASE = "https://wallhaven.cc/api/v1";
const DEV_BASE  = "/wh/api/v1";
const BASE = (typeof import.meta !== "undefined" && import.meta.env?.DEV)
  ? DEV_BASE
  : PROD_BASE;

export async function searchWallpapers({
  q = "",
  page = 1,
  per_page = 24,
  apiKey,              // <-- rename (camelCase)
  sorting = "toplist",
  order = "asc",
  topRange = "3M",
  purity = "100",      // SFW only
  categories = "100",  // General only
  ratios, atleast, colors,
} = {}) {
  const url = new URL(`${BASE}/search`, window.location.origin);
  url.searchParams.set("q", q);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(per_page));
  url.searchParams.set("sorting", sorting);
  url.searchParams.set("order", order);
  url.searchParams.set("topRange", topRange);
  url.searchParams.set("purity", String(purity));
  url.searchParams.set("categories", String(categories));
  if (ratios)  url.searchParams.set("ratios", ratios);
  if (atleast) url.searchParams.set("atleast", atleast);
  if (colors)  url.searchParams.set("colors", colors);

  // ❌ DO NOT append ?apikey=... (401 if empty/invalid)
  const headers = {};
  if (apiKey && String(apiKey).trim().length > 0) {
    headers["X-API-Key"] = String(apiKey).trim();   // ✅ header-based auth
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  let data = JSON.parse(text);
  if (data && data.contents) data = JSON.parse(data.contents); // proxy wrapper tolerance

  if (!data || !data.data) throw new Error("Unexpected API response.");
  return data; // { data, meta }
}


