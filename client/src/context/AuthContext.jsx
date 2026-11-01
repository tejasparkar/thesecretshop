import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('tss_token')) return setReady(true);
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('tss_token'))
      .finally(() => setReady(true));
  }, []);

  const handleAuth = ({ data }) => {
    localStorage.setItem('tss_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const login = (email, password) => api.post('/auth/login', { email, password }).then(handleAuth);
  const register = (name, email, password) => api.post('/auth/register', { name, email, password }).then(handleAuth);
  const logout = () => {
    localStorage.removeItem('tss_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
