import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/apiClient";
import { subscribeUserToPush } from "../utils/pushConfig";
/* =========================
   CONTEXT
========================= */
const AuthContext = createContext();

/* =========================
   PROVIDER
========================= */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     CHECK AUTH (ON FIRST LOAD)
     GET /auth/me
  ========================= */
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");

        if (isMounted) {
          setUser(res.data.user || null);
          if (res.data.user) {
    subscribeUserToPush(api); // التأكد من أن الإشعارات مفعلة إذا كان المستخدم مسجلاً
}
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =========================
     LOGIN ✅
     POST /auth/login
  ========================= */
  const login = async (email, password) => {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    setUser(res.data.user);
    await subscribeUserToPush(api); // تفعيل الإشعارات فور الدخول
    return res.data.user;
  };

  /* =========================
     LOGOUT ✅
     POST /auth/logout
  ========================= */
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // ignore
    }

    setUser(null);
  };

  /* =========================
     CONTEXT VALUE
  ========================= */
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/* =========================
   HOOK
========================= */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
