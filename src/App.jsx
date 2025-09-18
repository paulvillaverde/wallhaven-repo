import React, { useState, useEffect, useCallback } from "react";
import { searchWallpapers } from "./services/wallhaven";

const FILTERS = ["All", "Nature", "Abstract", "Space", "Minimal", "City"];

function formatBytes(bytes) {
  if (!bytes) return "";
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return bytes + " B";
  const units = ["KB", "MB", "GB", "TB"];
  let u = -1;
  do { bytes /= thresh; ++u; } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + units[u];
}

function ImageModal({ image, onClose, query }) {
  // derive tags/labels from available fields
  const isPortrait = image?.dimension_y > image?.dimension_x;
  const is4k = (image?.dimension_x >= 3840) || (image?.dimension_y >= 2160);
  const category = (image?.category || "general").replace(/^\w/, c => c.toUpperCase());

  const onKey = useCallback((e) => { if (e.key === "Escape") onClose(); }, [onClose]);
  useEffect(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onKey]);

  if (!image) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        {/* Actions (right top corner) */}
        <div className="modal__actions">
          <button className="btn btn--primary">Save</button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              const url = image.path || image.url || image.short_url;
              if (navigator.share) navigator.share({ url }).catch(() => {});
              else navigator.clipboard?.writeText(url);
            }}
            title="Share"
          >⤴</button>
          <button className="btn btn--ghost" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        {/* Left: big image */}
        <div className="detail__left">
          <img
            className="detail__image"
            src={image.path || image.thumbs?.large}
            alt={image.id}
            loading="eager"
          />
        </div>

        {/* Right: info panel */}
        <aside className="detail__right">
          <h2 className="detail__title">{image.id ? `#${image.id}` : "Wallpaper"}</h2>

          <div className="detail__chips">
            {query && <span className="chip">{query}</span>}
            <span className="chip">{category}</span>
            {is4k && <span className="chip chip--blue">4K</span>}
            <span className="chip">{isPortrait ? "Portrait" : "Landscape"}</span>
          </div>

          <div className="detail__stats">
            <div className="stat">
              <div className="stat__value">
                {(image.views ?? 0).toLocaleString()}
              </div>
              <div className="stat__label">Views</div>
            </div>
            <div className="stat">
              <div className="stat__value">
                {(image.favorites ?? 0).toLocaleString()}
              </div>
              <div className="stat__label">Favorites</div>
            </div>
          </div>

          <div className="detail__section">
            <h3>About this wallpaper</h3>
            <p>
              Resolution: {image.resolution || `${image.dimension_x}×${image.dimension_y}`}
              {image.file_type ? ` • ${image.file_type.toUpperCase()}` : ""}
            </p>
          </div>

          <div className="detail__section">
            <h3>Download Options</h3>
            <a
              className="btn btn--download"
              href={image.path || image.url}
              download
            >
              <span className="btn__icon">⬇</span>
              Download {is4k ? "4K" : "Full"}
              <span className="btn__meta">{formatBytes(image.file_size)}</span>
            </a>
          </div>

          {(image.colors && image.colors.length > 0) && (
            <div className="detail__section">
              <h3>Palette</h3>
              <div className="palette">
                {image.colors.slice(0, 6).map(c => (
                  <span key={c} className="swatch" style={{ background: c }} title={c}/>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const App = () => {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const apiKey = "JKtOMDLrvv6sLV5C0GYxyRLUlpPGWAry";

  const fetchWallpapers = async (searchQuery, currentPage) => {
    setLoading(true);
    setError("");
    try {
      const data = await searchWallpapers({
        q: searchQuery,
        page: currentPage,
        per_page: 16,
        apikey: apiKey,
      });
      setImages(data.data || []);
    } catch (err) {
      setError("Failed to fetch wallpapers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallpapers("pokemon", 1); }, []);
  useEffect(() => {
    const q = activeFilter === "All" ? query : activeFilter.toLowerCase();
    fetchWallpapers(q, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setActiveFilter("All");
    setPage(1);
    fetchWallpapers(query, 1);
  };

  const applyFilter = (name) => {
    setActiveFilter(name);
    setPage(1);
    const q = name === "All" ? "" : name.toLowerCase();
    setQuery(q);
    fetchWallpapers(q, 1);
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="brand">
        <h1 className="brand__title">WallHeaven</h1>
        <p className="brand__subtitle">Discover beautiful wallpapers for your devices</p>
      </header>
      <div className="divider" />

      {/* Search */}
      <div className="searchbar">
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M21 21l-3.5-3.5" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        <input
          type="search"
          placeholder="Search wallpapers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>

      {/* Filters */}
      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => applyFilter(f)}
            className={`filter-chip ${activeFilter === f ? "filter-chip--active" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && <p className="meta-line">Loading wallpapers...</p>}
      {error && <p className="meta-line" style={{ color: "red" }}>{error}</p>}
      {!loading && !error && images.length > 0 && (
        <p className="meta-line">Showing {images.length} wallpapers</p>
      )}

      {/* Masonry gallery; clicking opens modal */}
      <section className="gallery">
        {images.map((img) => {
          const w = img.dimension_x ?? 0;
          const h = img.dimension_y ?? 0;
          let orient = "landscape";
          if (w && h) {
            if (h > w * 1.1) orient = "portrait";
            else if (Math.abs(w - h) <= Math.min(w, h) * 0.1) orient = "square";
          }

          return (
            <button
              key={img.id}
              type="button"
              className={`card card--${orient}`}
              onClick={() => setSelected(img)}
              aria-label={`Open ${img.id}`}
            >
              <img className="card__media" src={img.thumbs.large} alt={img.id} />
            </button>
          );
        })}
      </section>


      {/* Pagination */}
      {images.length > 0 && (
        <div className="pagination">
          <button onClick={() => setPage(page > 1 ? page - 1 : 1)} disabled={page === 1}>Prev</button>
          <span style={{ alignSelf: "center", fontWeight: 500 }}>Page {page}</span>
          <button onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      <footer>Built with Wallhaven API</footer>

      {/* Detail modal */}
      {selected && (
        <ImageModal
          image={selected}
          query={query}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default App;
