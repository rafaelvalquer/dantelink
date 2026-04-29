import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getAuthMe,
  loginWithPassword,
  registerWithPassword,
  setApiAuthToken,
} from "./api.js";

const AUTH_STORAGE_KEY = "dandelink.auth.token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) || "");
  const [user, setUser] = useState(null);
  const [pageSummary, setPageSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setApiAuthToken(token);

    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!token) {
        setUser(null);
        setPageSummary(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getAuthMe();
        if (!active) return;
        setUser(response.user || null);
        setPageSummary(response.pageSummary || null);
      } catch {
        if (!active) return;
        setToken("");
        setUser(null);
        setPageSummary(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [token]);

  async function login(payload) {
    const response = await loginWithPassword(payload);
    setApiAuthToken(response.token || "");
    setToken(response.token || "");
    setUser(response.user || null);
    setPageSummary(response.pageSummary || null);
    return response;
  }

  async function register(payload) {
    const response = await registerWithPassword(payload);
    setApiAuthToken(response.token || "");
    setToken(response.token || "");
    setUser(response.user || null);
    setPageSummary(response.pageSummary || null);
    return response;
  }

  function logout() {
    setToken("");
    setUser(null);
    setPageSummary(null);
    setApiAuthToken("");
  }

  const value = useMemo(
    () => ({
      token,
      user,
      canAccessSystemMonitor: Boolean(user?.canAccessSystemMonitor),
      pageSummary,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [token, user, pageSummary, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return value;
}
