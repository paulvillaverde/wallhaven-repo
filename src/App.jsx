import React, { useState, useEffect } from "react";
import { searchWallpapers } from "./services/wallhaven";
import { useAuth } from "./hooks/useAuth";
import Register from "./auth/Register";
import Login from "./auth/Login";
import SignOutButton from "./auth/SignOutButton";
import AccountSidebar from "./components/AccountModal";

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
  do {
    bytes /= 1024;
    i++;
  } while (bytes >= 1024 && i < u.length - 1);
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

function ImageModal({ image, onClose, onNext, onPrev, query }) {
  if (!image) return null;

  const isPortrait = (image?.dimension_y ?? 0) > (image?.dimension_x ?? 0);
  const is4k =
    (image?.dimension_x ?? 0) >= 3840 || (image?.dimension_y ?? 0) >= 2160;
  const category = (image?.category || "general").replace(
    /^\w/,
    (c) => c.toUpperCase()
  );

  // keyboard: Esc to close, arrows to navigate
  const onKey = React.useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") onNext?.();
      if (e.key === "ArrowLeft") onPrev?.();
    },
    [onClose, onNext, onPrev]
  );

  React.useEffect(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__backdrop" onClick={onClose} />

      <div className="modal__panel">
        {/* Left: full image with containment (keeps orientation) */}
        <div className="detail__left" style={{ position: "relative" }}>
          {/* Prev Button */}
          <button
            className="nav-btn nav-btn--left"
            onClick={(e) => {
              e.stopPropagation();
              onPrev?.();
            }}
            aria-label="Previous"
          >
            ◀
          </button>
          <img
            className="detail__image"
            src={image.path || image.thumbs?.large || image.url}
            alt=""
          />
          {/* Next Button */}
          <button
            className="nav-btn nav-btn--right"
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            aria-label="Next"
          >
            ▶
          </button>
        </div>

        {/* Top-right actions */}
        <div className="modal__actions">
          <button className="btn btn--primary">Save</button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              const url = image.path || image.url || image.short_url;
              if (navigator.share) {
                navigator.share({ url }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(url);
              }
            }}
            aria-label="Share / copy link"
          >
            ⤴
          </button>
          <button className="btn btn--ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Right: details */}
        <aside className="detail__right">
          <h2 className="detail__title">
            {image.id ? `#${image.id}` : "Wallpaper"}
          </h2>

          <div className="detail__chips">
            {query && <span className="chip">{query}</span>}
            <span className="chip">{category}</span>
            {is4k && <span className="chip chip--blue">4K</span>}
            <span className="chip">{isPortrait ? "Portrait" : "Landscape"}</span>
          </div>

          <div className="detail__stats">
            <div>
              <div className="stat__value">
                {(image.views ?? 0).toLocaleString()}
              </div>
              <div className="stat__label">Views</div>
            </div>
            <div>
              <div className="stat__value">
                {(image.favorites ?? 0).toLocaleString()}
              </div>
              <div className="stat__label">Favorites</div>
            </div>
          </div>

          <div className="detail__section">
            <h3>About this wallpaper</h3>
            <p>
              Resolution:{" "}
              {image.resolution ||
                `${image.dimension_x}×${image.dimension_y}`}
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
                {image.colors.slice(0, 6).map((c) => (
                  <span
                    key={c}
                    className="swatch"
                    style={{ background: c }}
                    title={c}
                  />
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

  // modal state
  const [selected, setSelected] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // header controls
  const [safeMode, setSafeMode] = useState(true);

  // filters
  const [openDD, setOpenDD] = useState(false);
  const [sortBy, setSortBy] = useState(SORT[0].value);
  const [layout, setLayout] = useState(LAYOUT[0]);
  const [quality, setQuality] = useState(QUALITY[0]);
  const [color, setColor] = useState(COLORS[0]);

  // Add this state to store total pages
  const [totalPages, setTotalPages] = useState(1);

  const { user, setUser } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      sorting: sortBy, // toplist | date_added | views | favorites | random
      ratios, // comma-separated
      atleast, // resolution floor
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
        q: searchQuery,
        page: currentPage,
        per_page: 24,
        apikey: apiKey,
        ...params,
      });
      setImages(data?.data || []);
      setTotalPages(data?.meta?.last_page || 1); // <-- update here
    } catch (err) {
      console.error("[fetchWallpapers]", err);
      setImages([]);
      setError(err?.message || "Failed to fetch wallpapers. Please try again.");
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchWallpapers("", 1); // empty query = all wallpapers
  }, []);

  // page change (skip the very first render — initial load does an explicit fetch)
  const initialPageLoad = React.useRef(true);
  useEffect(() => {
    if (initialPageLoad.current) {
      initialPageLoad.current = false;
      return;
    }
    fetchWallpapers(query, page);
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
      if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target))
        setOpenDD(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openDD]);

  // Modal helpers (now correctly inside component)
  const openModal = (img, index) => {
    setSelected(img);
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelected(null);
    setSelectedIndex(null);
  };

  const showNext = () => {
    if (selectedIndex === null || images.length === 0) return;
    const nextIndex = (selectedIndex + 1) % images.length;
    setSelected(images[nextIndex]);
    setSelectedIndex(nextIndex);
  };

  const showPrev = () => {
    if (selectedIndex === null || images.length === 0) return;
    const prevIndex = (selectedIndex - 1 + images.length) % images.length;
    setSelected(images[prevIndex]);
    setSelectedIndex(prevIndex);
  };

  // Replace the inline fav click handler with this helper and update UI usage
  async function toggleFavorite(img) {
    // optimistic toggle
    const prev = img.isFav;
    img.isFav = !prev;
    setImages([...images]);

    try {
      if (!img.isFav) {
        // removed -> call DELETE
        const res = await fetch(`http://localhost:4000/api/user/favorites/${encodeURIComponent(img.id)}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Failed to remove favorite');
      } else {
        // added -> POST
        const res = await fetch('http://localhost:4000/api/user/favorites', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_id: img.id,
            title: img.id,
            url: img.path || img.url || img.short_url || null,
            thumb: img.thumbs?.small || img.thumbs?.large || null,
            dimension_x: img.dimension_x || null,
            dimension_y: img.dimension_y || null
          })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Failed to add favorite');
      }
    } catch (err) {
      // revert on error
      img.isFav = prev;
      setImages([...images]);
      console.error('Favorite toggle failed', err);
      // optionally show a toast / set error state
    }
  }

  function getInitials(user) {
    const raw = (user?.name || user?.email || '').trim();
    if (!raw) return 'U';
    const parts = raw.split(/[\s.@_+-]+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return (
    <div className="page">
      {/* === top navbar (logo + search) === */}
      <div className="nav">
        <div className="nav__left">
          <div className="logo-badge">W</div>
          <div className="nav__brand">
            <div className="nav__title">Wallheaven</div>
            <div className="nav__subtitle">Premium wallpapers</div>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {user ? (
            <>
              <button
                className="account-btn"
                onClick={() => setSidebarOpen(true)}
                aria-haspopup="dialog"
                title="Open account"
              >
                <span className="account-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
                    <circle cx="12" cy="12" r="10" fill="none" />
                    <circle cx="12" cy="8" r="3" fill="currentColor" />
                    <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="currentColor" />
                  </svg>
                </span>
              </button>
              <SignOutButton onSignedOut={() => setUser(null)} />
            </>
          ) : (
            <>
              <button onClick={() => { setShowLogin(v => !v); setShowRegister(false); }} className="btn btn-outline">Sign in</button>
              <button onClick={() => { setShowRegister(v => !v); setShowLogin(false); }} className="btn btn-primary">Register</button>
            </>
          )}
        </div>
      </div>

      {showLogin && <Login onSignedIn={(u) => { setUser(u); setShowLogin(false); }} />}
      {showRegister && <Register onSignedIn={(u) => { setUser(u); setShowRegister(false); }} />}

      {/* account sidebar */}
      <AccountSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      {/* === categories row (centered, no numbers) === */}
      <div className="cats">
        {TOP_CATS.map((c) => (
          <button
            key={c}
            className={`cat ${activeCat === c ? "cat--active" : ""}`}
            onClick={() => {
              setActiveCat(c);
              setPage(1);
              fetchWallpapers(c === "All Wallpapers" ? "" : c, 1);
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* === toolbar: Filters button + Safe Mode toggle === */}
      <div className="toolbar wallify">
        <button className="filters__btn" onClick={() => setOpenDD((v) => !v)}>
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
                  {SORT.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="select__chev">▾</span>
              </div>
            </div>

            <div className="filters-dd__row">
              <span className="filters-dd__label">Layout:</span>
              <div className="chiprow">
                {LAYOUT.map((v) => (
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
                {QUALITY.map((v) => (
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
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    className={`chip2 ${color.name === c.name ? "chip2--active" : ""}`}
                    onClick={() => setColor(c)}
                  >
                    <span
                      className="dot"
                      style={{
                        background: c.hex
                          ? `#${c.hex}`
                          : "linear-gradient(90deg,#ff6b6b,#ffd93d,#6bcBef)",
                      }}
                    />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters-dd__actions">
              <button className="btn btn--ghost" onClick={resetFilters}>
                Reset
              </button>
              <button className="btn btn--primary" onClick={applyFilters}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* === states === */}
      {loading && <p className="meta-line">Loading wallpapers...</p>}
      {error && <p className="meta-line" style={{ color: "red" }}>{error}</p>}

      {/* === gallery === */}
      <section className="gallery">
        {images.map((img, idx) => (
          <div
            key={img.id ?? `${img.url}-${idx}`}
            className="cardv"
            onClick={() => openModal(img, idx)}
            role="button"
            tabIndex={0}
          >
            <div className="cardv__media">
              {(img.thumbs?.large || img.url) && (
                <img
                  src={img.thumbs?.large || img.url}
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
                    // require signed in user
                    if (!user) {
                      setShowLogin(true);
                      return;
                    }
                    toggleFavorite(img);
                  }}
                >
                  {img.isFav ? "❤️" : "🤍"}
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="cardv__body">
              <h3 className="cardv__title">{img.id || "Wallpaper"}</h3>
              <div className="cardv__by">
                by <span>{img.uploader?.username || "Unknown"}</span>
              </div>

              <div className="meta">
                <div className="meta__item" title="Favorites">
                  {(img.favorites ?? 0).toLocaleString()} ❤️
                </div>
                <div className="meta__item" title="Views">
                  {(img.views ?? 0).toLocaleString()} 👁
                </div>
                <div className="meta__item" title="Resolution">
                  {img.resolution ||
                    `${img.dimension_x ?? "—"}×${img.dimension_y ?? "—"}`}
                </div>
              </div>

              <div className="tags">
                {(img.tags || []).slice(0, 3).map((t) => (
                  <span key={t?.id || t?.name} className="tag">
                    {t?.name || "tag"}
                  </span>
                ))}
                {Array.isArray(img.tags) && img.tags.length > 3 && (
                  <span className="tag tag--muted">+{img.tags.length - 3}</span>
                )}
                {!img.tags && (
                  <>
                    <span className="tag">{img.category || "general"}</span>
                    <span className="tag">
                      {img.file_type?.toUpperCase() || "IMAGE"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {images.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            style={{
              margin: "0 8px",
              borderRadius: "6px",
              border: "none",
              padding: "6px 12px",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              background: "transparent"
            }}
          >
            ◀ Prev
          </button>

          {(() => {
            const maxButtons = 5;
            let start = Math.max(1, page - Math.floor(maxButtons / 2));
            let end = start + maxButtons - 1;
            if (end > totalPages) {
              end = totalPages;
              start = Math.max(1, end - maxButtons + 1);
            }
            return Array.from({ length: end - start + 1 }, (_, i) => (
              <button
                key={start + i}
                onClick={() => setPage(start + i)}
                className={page === start + i ? "active" : ""}
                style={{
                  margin: "0 4px",
                  fontWeight: page === start + i ? "bold" : "normal",
                  background: page === start + i ? "#eee" : "transparent",
                  borderRadius: "6px",
                  border: "none",
                  padding: "6px 12px",
                  cursor: "pointer"
                }}
              >
                {start + i}
              </button>
            ));
          })()}

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            style={{
              margin: "0 8px",
              borderRadius: "6px",
              border: "none",
              padding: "6px 12px",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              background: "transparent"
            }}
          >
            Next ▶
          </button>
        </div>
      )}

      <footer>Built with Wallhaven API</footer>

      {selected && (
        <ImageModal
          image={selected}
          onClose={closeModal}
          onNext={showNext}
          onPrev={showPrev}
          query={query}
        />
      )}
    </div>
  );
};

export default App;
