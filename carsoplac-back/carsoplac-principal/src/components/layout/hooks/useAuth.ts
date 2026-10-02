import { useState, useEffect } from 'react';
import { API_URL } from '../../../config/api';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check failed', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (_username: string, _password: string) => {
    // In practice, login is handled by the Login page via form submit.
    // This function could be used elsewhere if needed.
    window.location.href = `${API_URL}/auth/login`;
  };

  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    // Optionally redirect to home or login
    window.location.href = '/';
  };

  return { user, loading, login, logout };
};