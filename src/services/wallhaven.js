// services/wallhaven.js
const BASE = "https://wallhaven.cc/api/v1";

/**
 * Search wallpapers with resilient fetch:
 * 1) Direct request (works if CORS is allowed)
 * 2) Fallback proxies if needed
 */
export async function searchWallpapers({
  q = "",
  page = 1,
  per_page = 24,
  apikey,
  sorting,
  ratios,
  atleast,
  colors,
  purity,        // "100" (SFW) | "110" (SFW + sketchy). NSFW needs key + allowed.
  categories,    // e.g. "100" general only
  order,         // "desc" | "asc"
  topRange,      // "1d","3d","1w","1M","3M","6M","1y" (only for toplist)
} = {}) {
  const apiUrl = new URL(`${BASE}/search`);
  apiUrl.searchParams.set("q", q);
  apiUrl.searchParams.set("page", page);
  apiUrl.searchParams.set("per_page", per_page);

  // Only add provided filters
  const params = { sorting, ratios, atleast, colors, purity, categories, order, topRange };
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") apiUrl.searchParams.set(k, String(v));
  });

  if (apikey) apiUrl.searchParams.set("apikey", apikey);

  // Try direct first (Wallhaven API typically allows CORS),
  // then fall back to a couple of proxies if your environment blocks it.
  const attempts = [
    apiUrl.toString(),
    // AllOrigins raw
    `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl.toString())}`,
    // Isomorphic-git CORS passthrough
    `https://cors.isomorphic-git.org/${apiUrl.toString()}`,
  ];

  const errors = [];
  for (const url of attempts) {
    try {
      // Helpful in DevTools
      // eslint-disable-next-line no-console
      console.log("[wallhaven] fetching:", url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Wallhaven returns { data: [...] }
      if (!data || typeof data !== "object" || !("data" in data)) {
        throw new Error("Invalid API response shape");
      }
      return data;
    } catch (e) {
      errors.push(`${url} → ${e.message}`);
    }
  }

  // If all attempts failed, surface a detailed error for debugging
  throw new Error(`All fetch attempts failed:\n${errors.join("\n")}`);
}
