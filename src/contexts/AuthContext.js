// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.chrome && window.chrome.storage) {
      window.chrome.storage.local.get("nexaura_token", (result) => {
        if (result.nexaura_token) {
          setToken(result.nexaura_token);
        } else {
            const localToken = localStorage.getItem("nexaura_token");
            if (localToken) setToken(localToken);
        }
        setLoading(false);
      });
    } else {
        const localToken = localStorage.getItem("nexaura_token");
        if (localToken) {
            setToken(localToken);
        }
        setLoading(false);
    }
  }, []);

  const login = (newToken) => {
    setToken(newToken);
    // 🟢 CRITICAL FIX: Actually save the token so the web app remembers the login!
    localStorage.setItem("nexaura_token", newToken); 
  };

  const logout = () => {
    setToken(null);
    // 🟢 CRITICAL FIX: Clear it on logout
    localStorage.removeItem("nexaura_token"); 
    // if (window.chrome && window.chrome.storage) {
    //   window.chrome.storage.local.remove("nexaura_token");
    // }
    window.postMessage({ type: "NEXAURA_LOGOUT" }, window.location.origin);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);