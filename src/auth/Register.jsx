import React, { useState } from "react";

export default function Register({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Registration failed");
      onSignedIn && onSignedIn(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h3 className="auth-title">Create account</h3>
      <form onSubmit={submit} className="auth-form">
        <label className="auth-label">Name (optional)</label>
        <input
          className="auth-input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="auth-label">Email</label>
        <input
          className="auth-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <label className="auth-label">Password</label>
        <input
          className="auth-input"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        <div className="auth-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}