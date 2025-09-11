import React, { useState, useEffect } from 'react';
import { searchWallpapers } from './services/wallhaven';

const App = () => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiKey = 'JKtOMDLrvv6sLV5C0GYxyRLUlpPGWAry'; // Your API key

  // Fetch wallpapers from Wallhaven API
  const fetchWallpapers = async (searchQuery = query, currentPage = page) => {
    setLoading(true);
    setError('');
    try {
      const data = await searchWallpapers({
        q: searchQuery,
        page: currentPage,
        per_page: 16, // 4x4 grid
        apikey: apiKey,
      });

      setImages(data.data || []);
    } catch (err) {
      setError('Failed to fetch wallpapers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when search query or page changes
  useEffect(() => {
    fetchWallpapers(query, page);
  }, [page]);

  // Default search when app loads
  useEffect(() => {
    fetchWallpapers('pokemon', 1);
  }, []);

  const handleSearch = () => {
    setPage(1); // Reset to first page
    fetchWallpapers(query, 1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      {/* Title */}
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Wallhaven Browser</h1>

      {/* Search Bar */}
      <div className="flex space-x-2 mb-8">
        <input
          type="text"
          placeholder="Search wallpapers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-64 shadow-sm"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition shadow"
        >
          Search
        </button>
      </div>

      {/* Loading State */}
      {loading && <p className="text-gray-500 mb-4">Loading wallpapers...</p>}

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* No Results */}
      {!loading && !error && images.length === 0 && (
        <p className="text-gray-500 mb-4">No results found.</p>
      )}

      {/* Wallpaper Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group rounded-xl overflow-hidden shadow hover:shadow-lg transition"
          >
            <img
              src={img.thumbs.large}
              alt={img.id}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 text-white text-sm p-2 opacity-0 group-hover:opacity-100 transition">
              {img.id}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {images.length > 0 && (
        <div className="flex items-center space-x-4 mt-8">
          <button
            onClick={() => setPage(page > 1 ? page - 1 : 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-400 transition"
          >
            Prev
          </button>
          <span className="text-gray-700 font-medium">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-gray-500 text-sm">
        Built with Wallhaven API
      </footer>
    </div>
  );
};

export default App;
