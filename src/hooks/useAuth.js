import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch("http://localhost:4000/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setUser(data.user);
      })
      .catch(() => {});
  }, []);
  return { user, setUser };
}