import { useState } from 'react';
import api from '../services/api';

export const useAuth = () => {
  const [token, setToken] = useState(sessionStorage.getItem('jwt'));
  const [error, setError] = useState('');

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;
      if (access_token) {
        sessionStorage.setItem('jwt', access_token);
        setToken(access_token);
        setError('');
      } else {
        throw new Error('No se recibió token de autenticación');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : 'Credenciales inválidas');
      setError(message);
      const typedErr = err instanceof Error ? err : undefined;
      const loginErr = new Error(message, { cause: typedErr });
      throw loginErr;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('jwt');
    setToken(null);
    setError('');
  };

  const isAuthenticated = () => !!sessionStorage.getItem('jwt');

  return { token, isAuthenticated, error, login, logout };
};

export default useAuth;
