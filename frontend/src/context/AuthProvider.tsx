import { type ReactNode, useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { fetchCurrentUser } from "@/api/userApi";
import { AuthContext } from "@/context/AuthContext";
import { tokenStore } from "@/context/token-store";
import routes from "@/route-helpers";
import type { User } from "@/types";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const token = useSyncExternalStore(tokenStore.subscribe, tokenStore.getToken);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = loading ? null : !!user;

  const fetchUser = useCallback(async () => {
    try {
      const result = await fetchCurrentUser();
      setUser(result);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      logout();
      window.location.href = routes.login;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser, token]);

  const login = async (token: string): Promise<boolean> => {
    try {
      tokenStore.setToken(token);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    tokenStore.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
