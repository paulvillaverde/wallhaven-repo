import React, { useState, useEffect, useCallback } from "react";
import { searchWallpapers } from "./services/wallhaven";

/* ===================== Constants ===================== */

// Categories (top row)
const TOP_CATS = [
  "All Wallpapers",
  "Nature",
  "Abstract",
  "Minimal",
  "Space",
  "Anime",
  "Games",
  "Technology",
];

// Filters
const SORT = [
  { label: "Most Popular", value: "toplist" },
  { label: "Latest", value: "date_added" },
  { label: "Most Viewed", value: "views" },
  { label: "Most Favorited", value: "favorites" },
  { label: "Random", value: "random" },
];
const LAYOUT = ["All Orientations", "Landscape", "Portrait", "Square"];
const QUALITY = ["All Resolutions", "4K & Above", "HD (1080p)", "Mobile Ready"];
const COLORS = [
  { name: "All Colors", hex: null },
  { name: "Red", hex: "ff0000" },
  { name: "Blue", hex: "0000ff" },
  { name: "Green", hex: "00ff00" },
  { name: "Purple", hex: "800080" },
  { name: "Orange", hex: "ffa500" },
  { name: "Pink", hex: "ff69b4" },
  { name: "Black", hex: "000000" },
  { name: "White", hex: "ffffff" },
];

/* ===================== Utils ===================== */

function formatBytes(bytes) {
  if (!bytes) return "";
  const u = ["KB", "MB", "GB", "TB"];
  let i = -1;
  do { bytes /= 1024; i++; } while (bytes >= 1024 && i < u.length - 1);
  return `${bytes.toFixed(1)}${u[i]}`;
}

// derive badges (kept in case you re-enable later)
const isRecent = (iso, days = 14) =>
  iso && Date.now() - new Date(iso).getTime() < days * 24 * 60 * 60 * 1000;

const deriveBadges = (w) => {
  const trending =
    isRecent(w.created_at, 14) &&
    ((w.views ?? 0) >= 5000 || (w.favorites ?? 0) >= 100);

  const editorsPick =
    ((w.dimension_x ?? 0) >= 3840 || (w.dimension_y ?? 0) >= 2160) &&
    (w.favorites ?? 0) >= 250;

  return { trending, editorsPick };
};

/* ===================== Modal ===================== */

function ImageModal({ image, onClose, query }) {
  const isPortrait = image?.dimension_y > image?.dimension_x;
  const is4k = image?.dimension_x >= 3840 || image?.dimension_y >= 2160;
  const category = (image?.category || "general").replace(/^\w/, c => c.toUpperCase());

  const esc = useCallback((e) => e.key === "Escape" && onClose(), [onClose]);
  useEffect(() => {
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [esc]);

  if (!image) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__actions">
          <button className="btn btn--primary">Save</button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              const url = image.path || image.url || image.short_url;
              if (navigator.share) navigator.share({ url }).catch(() => {});
              else navigator.clipboard?.writeText(url);
            }}
          >
            ⤴
          </button>
          <button className="btn btn--ghost" onClick={onClose}>✕</button>
        </div>

        <div className="detail__left">
          <img className="detail__image" src={image.path || image.thumbs?.large} alt={image.id} />
        </div>

        <aside className="detail__right">
          <h2 className="detail__title">{image.id ? `#${image.id}` : "Wallpaper"}</h2>

          <div className="detail__chips">
            {query && <span className="chip">{query}</span>}
            <span className="chip">{category}</span>
            {is4k && <span className="chip chip--blue">4K</span>}
            <span className="chip">{isPortrait ? "Portrait" : "Landscape"}</span>
          </div>

          <div className="detail__stats">
            <div>
              <div className="stat__value">{(image.views ?? 0).toLocaleString()}</div>
              <div className="stat__label">Views</div>
            </div>
            <div>
              <div className="stat__value">{(image.favorites ?? 0).toLocaleString()}</div>
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
            <a className="btn btn--download" href={image.path || image.url} download>
              <span className="btn__icon">⬇</span>
              Download {is4k ? "4K" : "Full"}
              <span className="btn__meta">{formatBytes(image.file_size)}</span>
            </a>
          </div>

          {image.colors?.length ? (
            <div className="detail__section">
              <h3>Palette</h3>
              <div className="palette">
                {image.colors.slice(0, 6).map(c => (
                  <span key={c} className="swatch" style={{ background: c }} title={c} />
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

/* ===================== App ===================== */

const App = () => {
  // categories
  const [activeCat, setActiveCat] = useState("All Wallpapers");

  const [query, setQuery] = useState("");
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  // header controls
  const [safeMode, setSafeMode] = useState(true);

  // filters
  const [openDD, setOpenDD] = useState(false);
  const [sortBy, setSortBy] = useState(SORT[0].value);
  const [layout, setLayout] = useState(LAYOUT[0]);
  const [quality, setQuality] = useState(QUALITY[0]);
  const [color, setColor] = useState(COLORS[0]);

  const apiKey = "JKtOMDLrvv6sLV5C0GYxyRLUlpPGWAry";

  const buildParams = () => {
    let ratios;
    if (layout === "Landscape") ratios = "16x9,21x9,16x10,4x3,3x2";
    else if (layout === "Portrait") ratios = "9x16,10x16,2x3,3x4";
    else if (layout === "Square") ratios = "1x1";

    let atleast;
    if (quality === "4K & Above") atleast = "3840x2160";
    else if (quality === "HD (1080p)") atleast = "1920x1080";
    else if (quality === "Mobile Ready") atleast = "1080x1920";

    return {
      sorting: sortBy,       // toplist | date_added | views | favorites | random
      ratios,                // comma-separated
      atleast,               // resolution floor
      colors: color.hex ?? undefined, // hex w/o #
      purity: safeMode ? "100" : "110",
      // categories: "100",
      // order: "desc",
    };
  };

  // Async fetch function
  const fetchWallpapers = async (searchQuery, currentPage) => {
    setLoading(true);
    setError("");
    try {
      const params = buildParams();
      const data = await searchWallpapers({
        q: searchQuery, // category/search term
        page: currentPage,
        per_page: 24,
        apikey: apiKey,
        ...params,
      });
      setImages(data?.data || []);
    } catch (err) {
      console.error("[fetchWallpapers]", err);
      setImages([]);
      setError(err?.message || "Failed to fetch wallpapers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    const load = async () => {
      await fetchWallpapers("pokemon", 1);
    };
    load();
  }, []);

  // page change
  useEffect(() => {
    const load = async () => {
      await fetchWallpapers(query, page);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    fetchWallpapers(query, 1);
    setOpenDD(false);
  };

  const handleSearch = async () => {
    setPage(1);
    await fetchWallpapers(query, 1);
  };

  const resetFilters = () => {
    setSortBy(SORT[0].value);
    setLayout(LAYOUT[0]);
    setQuality(QUALITY[0]);
    setColor(COLORS[0]);
  };

  // close dropdown on outside click
  useEffect(() => {
    if (!openDD) return;
    const close = (e) => {
      const panel = document.querySelector(".filters-dd");
      const btn = document.querySelector(".filters__btn");
      if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) setOpenDD(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openDD]);

  return (
    <div className="page">
      {/* === top navbar (logo + search) === */}
      <div className="nav">
        <div className="nav__left">
          <div className="logo-badge">W</div>
          <div className="nav__brand">
            <div className="nav__title">Wallify</div>
            <div className="nav__subtitle">Premium wallpapers</div>
          </div>
        </div>

        <div className="nav__search">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M21 21l-3.5-3.5" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <input
            type="search"
            placeholder="Search for nature, abstract, space..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchWallpapers(query, 1)}
          />
        </div>
      </div>

      {/* === categories row (centered, no numbers) === */}
      <div className="cats">
        {TOP_CATS.map((c) => (
          <button
            key={c}
            className={`cat ${activeCat === c ? "cat--active" : ""}`}
            onClick={() => {
              setActiveCat(c);
              setPage(1); // reset to first page when changing category
              fetchWallpapers(c === "All Wallpapers" ? "" : c, 1);
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* === toolbar: Filters button + Safe Mode toggle === */}
      <div className="toolbar wallify">
        <button className="filters__btn" onClick={() => setOpenDD(v => !v)}>
          <span className="filters__icon">⏷</span> Filters
        </button>

        <div className="safe">
          <span>Safe Mode</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={safeMode}
              onChange={(e) => setSafeMode(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        {openDD && (
          <div className="filters-dd">
            <div className="filters-dd__row">
              <label className="filters-dd__label">Sort by:</label>
              <div className="select">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="select__chev">▾</span>
              </div>
            </div>

            <div className="filters-dd__row">
              <span className="filters-dd__label">Layout:</span>
              <div className="chiprow">
                {LAYOUT.map(v => (
                  <button
                    key={v}
                    className={`chip2 ${layout === v ? "chip2--active" : ""}`}
                    onClick={() => setLayout(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters-dd__row">
              <span className="filters-dd__label">Quality:</span>
              <div className="chiprow">
                {QUALITY.map(v => (
                  <button
                    key={v}
                    className={`chip2 ${quality === v ? "chip2--active" : ""}`}
                    onClick={() => setQuality(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters-dd__row">
              <span className="filters-dd__label">Color:</span>
              <div className="chiprow">
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    className={`chip2 ${color.name === c.name ? "chip2--active" : ""}`}
                    onClick={() => setColor(c)}
                  >
                    <span
                      className="dot"
                      style={{
                        background: c.hex ? `#${c.hex}` : "linear-gradient(90deg,#ff6b6b,#ffd93d,#6bcBef)"
                      }}
                    />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters-dd__actions">
              <button className="btn btn--ghost" onClick={resetFilters}>Reset</button>
              <button className="btn btn--primary" onClick={applyFilters}>Apply</button>
            </div>
          </div>
        )}
      </div>

      {/* === states === */}
      {loading && <p className="meta-line">Loading wallpapers...</p>}
      {error && <p className="meta-line" style={{ color: "red" }}>{error}</p>}

      {/* === gallery with corrected card (no duplication) === */}
      <section className="gallery">
        {images.map((img) => (
          <div
            key={img.id}
            className="cardv"
            role="button"
            tabIndex={0}
            onClick={() => setSelected(img)}
          >
            {/* IMAGE */}
            <div className="cardv__media">
              {img.thumbs?.large && (
              <img
                src={img.thumbs.large}
                alt="Wallpaper preview"
                loading="lazy"
              />
            )}

              {/* HOVER OVERLAY: only View + Get */}
              <div className="cardv__overlay">
                <button
                  className={`fav-btn ${img.isFav ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    img.isFav = !img.isFav; // temporary local toggle
                    setImages([...images]); // re-render (simple demo)
                  }}
                >
                  {img.isFav ? "❤️" : "🤍"}
                </button>
              </div>
              </div>

            {/* BODY (always visible) */}
            <div className="cardv__body">
              <h3 className="cardv__title">{img.id || "Wallpaper"}</h3>
              <div className="cardv__by">by <span>{img.uploader?.username || "Unknown"}</span></div>

              <div className="meta">
                <div className="meta__item" title="Favorites">
                  {(img.favorites ?? 0).toLocaleString()} ❤️
                </div>
                <div className="meta__item" title="Views">
                  {(img.views ?? 0).toLocaleString()} 👁
                </div>
                <div className="meta__item" title="Resolution">
                  {img.resolution || `${img.dimension_x}×${img.dimension_y}`}
                </div>
              </div>

              <div className="tags">
                {(img.tags || []).slice(0, 3).map(t => (
                  <span key={t?.id || t?.name} className="tag">{t?.name || "tag"}</span>
                ))}
                {Array.isArray(img.tags) && img.tags.length > 3 && (
                  <span className="tag tag--muted">+{img.tags.length - 3}</span>
                )}
                {!img.tags && (
                  <>
                    <span className="tag">{img.category || "general"}</span>
                    <span className="tag">{img.file_type?.toUpperCase() || "IMAGE"}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>


      {images.length > 0 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span style={{ alignSelf: "center", fontWeight: 500 }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      <footer>Built with Wallhaven API</footer>

      {selected && <ImageModal image={selected} query={query} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default App;
