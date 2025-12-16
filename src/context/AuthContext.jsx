import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/apiClient";

/* =========================
   CONTEXT
========================= */
const AuthContext = createContext();

/* =========================
   PROVIDER
========================= */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔐 مهم جدًا: نمنع أي render قبل انتهاء التحقق
  const [loading, setLoading] = useState(true);

  /* =========================
     CHECK AUTH (ON FIRST LOAD)
  ========================= */
  useEffect(() => {
    let isMounted = true; // 🛡️ يمنع state update بعد unmount

    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");

        if (isMounted) {
          setUser(res.data.user || null);
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
     LOGIN
  ========================= */
  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });

    // السيرفر يعيد user فقط (Cookies محفوظة)
    setUser(res.data.user);
    return res.data.user;
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = async () => {
    try {
      await api.post("/logout");
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
      {/* 🔒 لا نسمح بعرض أي شيء قبل انتهاء التحقق */}
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
