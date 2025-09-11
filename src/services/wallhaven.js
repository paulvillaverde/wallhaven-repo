const BASE = 'https://wallhaven.cc/api/v1';

export async function searchWallpapers({ q = '', page = 1, per_page = 24, apikey } = {}) {
  const url = new URL(`${BASE}/search`);
  
  // ✅ Search query
  url.searchParams.set('q', q);
  url.searchParams.set('page', page);
  url.searchParams.set('per_page', per_page);

  // ✅ Only safe images
  url.searchParams.set('purity', '100');

  // ✅ Include API key
  if (apikey) {
    url.searchParams.set('apikey', apikey);
  }

  // ✅ Add CORS proxy for development
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url.toString())}`;

  console.log('Fetching from:', proxyUrl); // Debugging
  const res = await fetch(proxyUrl);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
