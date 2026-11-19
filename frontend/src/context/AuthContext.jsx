import { createContext, useContext, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw) : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(load);

  function save(next) {
    setAuth(next);
    try {
      localStorage.setItem('auth', JSON.stringify(next));
    } catch {
      /* storage unavailable, login lasts until page refresh */
    }
  }

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    save({ user: data.user, token: data.token });
  }

  async function register(name, email, password) {
    const data = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    save({ user: data.user, token: data.token });
  }

  function logout() {
    save({ user: null, token: null });
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
