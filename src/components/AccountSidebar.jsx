import React, { useEffect, useState } from "react";

export default function AccountSidebar({ open, onClose, user }) {
  const [tab, setTab] = useState("favorites");
  const [favorites, setFavorites] = useState(null);
  const [loadingFavs, setLoadingFavs] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab("favorites");
    // try to load favorites (endpoint optional)
    (async () => {
      setLoadingFavs(true);
      try {
        const res = await fetch("http://localhost:4000/api/user/favorites", {
          credentials: "include",
        });
        if (!res.ok) {
          setFavorites([]);
        } else {
          const data = await res.json();
          setFavorites(Array.isArray(data?.favorites) ? data.favorites : []);
        }
      } catch (e) {
        setFavorites([]);
      } finally {
        setLoadingFavs(false);
      }
    })();
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="account-overlay open" onClick={onClose} />
      <aside className={`account-sidebar open`} role="dialog" aria-hidden={!open}>
        <div className="account-panel">
          <div className="account-header">
            <div className="account-info">
              <div className="account-avatar">
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <div className="account-name">{user?.name || user?.email || "Guest"}</div>
                <div className="account-email">{user?.email || ""}</div>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="account-tabs">
            <button className={`tab ${tab === "favorites" ? "active" : ""}`} onClick={() => setTab("favorites")}>
              Favorites
            </button>
            <button className={`tab ${tab === "about" ? "active" : ""}`} onClick={() => setTab("about")}>
              About
            </button>
          </div>

          <div className="account-body">
            {tab === "favorites" && (
              <div className="favorites">
                {loadingFavs ? (
                  <div className="muted">Loading favorites…</div>
                ) : !favorites || favorites.length === 0 ? (
                  <div className="muted">No favorites yet. Click the heart on any wallpaper to save it here.</div>
                ) : (
                  <ul className="favorites-list">
                    {favorites.map((f) => (
                      <li key={f.id} className="fav-item">
                        <img src={f.thumb || f.preview || f.url} alt={f.title || f.id} />
                        <div className="fav-meta">
                          <div className="fav-title">{f.title || f.id}</div>
                          <div className="muted">{f.dimensions || ""}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "about" && (
              <div className="about">
                <h4>Account</h4>
                <dl>
                  <dt>Email</dt>
                  <dd>{user?.email || "—"}</dd>
                  <dt>Name</dt>
                  <dd>{user?.name || "—"}</dd>
                </dl>

                <h4 style={{ marginTop: 12 }}>About</h4>
                <p className="muted">
                  This account stores your preferences and favorites. In production this is backed by a secure server and a database.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}