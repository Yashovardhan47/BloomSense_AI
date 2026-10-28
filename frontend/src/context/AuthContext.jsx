import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { authApi } from "../services/auth/authService";
import { clearSession, getSession, saveSession } from "../services/auth/tokenManager";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const sync = () => setSession(getSession());
    window.addEventListener("bloomsense-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bloomsense-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const accept = (next) => {
    saveSession(next);
    setSession(next);
    return next;
  };

  const value = useMemo(
    () => ({
      user: session?.user || null,
      session,
      ready,
      login: (email, password) => authApi.login(email, password).then(accept),
      register: (name, email, password) => authApi.register(name, email, password).then(accept),
      googleLogin: (credential) => authApi.google(credential).then(accept),
      enterDemo: () => authApi.demo().then(accept),
      logout: async () => {
        try {
          if (session?.refresh_token) await authApi.logout(session.refresh_token);
        } finally {
          clearSession();
          setSession(null);
        }
      },
    }),
    [session, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
