import { createContext, useCallback, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("customerToken"),
  );

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("customerUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((data) => {
    const newToken = data?.token;
    const newUser = data?.user;

    if (!newToken || !newUser) {
      throw new Error("Login response is missing token or user");
    }

    localStorage.setItem("customerToken", newToken);
    localStorage.setItem("customerUser", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");

    setToken(null);
    setUser(null);
  }, []);

  const isLoggedIn = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
