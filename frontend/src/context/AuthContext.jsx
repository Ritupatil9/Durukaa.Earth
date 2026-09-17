import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, loginUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("darukaa_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("darukaa_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    // Validate the stored token is still good and refresh the user record.
    fetchCurrentUser()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem("darukaa_user", JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem("darukaa_token");
        localStorage.removeItem("darukaa_user");
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await loginUser(credentials);
    localStorage.setItem("darukaa_token", result.access_token);
    localStorage.setItem("darukaa_user", JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await registerUser(payload);
    localStorage.setItem("darukaa_token", result.access_token);
    localStorage.setItem("darukaa_user", JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("darukaa_token");
    localStorage.removeItem("darukaa_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
