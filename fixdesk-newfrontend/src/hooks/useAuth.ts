import { useState, useEffect } from 'react';
import { authUtils } from '../utils/auth';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authUtils.isAuthenticated());
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = authUtils.getToken();
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (token: string) => {
    authUtils.saveToken(token);
    setToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authUtils.removeToken();
    setToken(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    token,
    login,
    logout,
  };
};