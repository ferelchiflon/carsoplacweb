import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already authenticated
  if (isAuthenticated()) {
    navigate('/', { replace: true });
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await authLogin(email.trim(), password);
      // Check authentication result
      if (isAuthenticated()) {
        navigate('/products', { replace: true });
      } else {
        // Auth failed but no error was set - show generic message
        setError('Credenciales inválidas');
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [email, password, authLogin, isAuthenticated, navigate]);

  return (
    <div className={styles.loginContainer}>
      {/* Left: Branding */}
      <div className={styles.loginBrand}>
        <div className={styles.loginBrandBg} />
        <div className={styles.loginBrandContent}>
          <div className={styles.loginBrandLogo}>CP</div>
          <h1 className={styles.loginBrandTitle}>Carso Plac</h1>
          <p className={styles.loginBrandSubtitle}>
            Panel de administración profesional para gestionar tu catálogo de
            productos, pedidos y clientes en tiempo real.
          </p>
          <div className={styles.loginBrandFeatures}>
            <div className={styles.loginBrandFeature}>
              <div className={styles.loginBrandFeatureIcon}>📦</div>
              <div className={styles.loginBrandFeatureText}>
                <span className={styles.loginBrandFeatureTitle}>Gestión de Productos</span>
                <span className={styles.loginBrandFeatureDesc}>
                  Administra tu catálogo con fotos, precios y stock
                </span>
              </div>
            </div>
            <div className={styles.loginBrandFeature}>
              <div className={styles.loginBrandFeatureIcon}>🛒</div>
              <div className={styles.loginBrandFeatureText}>
                <span className={styles.loginBrandFeatureTitle}>Control de Pedidos</span>
                <span className={styles.loginBrandFeatureDesc}>
                  Visualiza y gestiona todas tus órdenes en un solo lugar
                </span>
              </div>
            </div>
            <div className={styles.loginBrandFeature}>
              <div className={styles.loginBrandFeatureIcon}>📊</div>
              <div className={styles.loginBrandFeatureText}>
                <span className={styles.loginBrandFeatureTitle}>Analíticas en Tiempo Real</span>
                <span className={styles.loginBrandFeatureDesc}>
                  Métricas clave de tu negocio al instante
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className={styles.loginForm}>
        <div className={styles.loginFormInner}>
          <div className={styles.loginFormHeader}>
            <h2 className={styles.loginFormTitle}>Iniciar Sesión</h2>
            <p className={styles.loginFormSubtitle}>
              Ingresá tus credenciales para acceder al panel de administración
            </p>
          </div>

          {error && (
            <div className={styles.loginError}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="inputGroup">
              <label htmlFor="email" className="inputLabel">
                Usuario o Email
              </label>
              <input
                id="email"
                type="text"
                className="inputField"
                placeholder="admin@carsoplac.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="inputGroup">
              <label htmlFor="password" className="inputLabel">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="inputField"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={`${styles.loginSubmitBtn} ${loading ? styles.loginSubmitBtnLoading : ''}`}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className={styles.loginFormDivider}>Seguridad</div>

          <div className={styles.loginFooter}>
            Panel administrativo protegido con autenticación JWT.<br />
            <a href="/">Volver a la tienda</a>
          </div>
        </div>
      </div>
    </div>
  );
}