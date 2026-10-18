import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import styles from './MiCuenta.module.css';

export default function MiCuenta() {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch user profile
        const userResponse = await api.get('/users/me');
        setUser(userResponse.data);

        // Fetch user orders
        const ordersResponse = await api.get('/orders/mine');
        setOrders(ordersResponse.data);
      } catch (err: any) {
        setError('Failed to load user data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mi Cuenta</h1>
      <div className={styles.userInfo}>
        <h2>Perfil</h2>
        <p><strong>Nombre:</strong> {user?.name || 'N/A'}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Rol:</strong> {user?.role}</p>
      </div>
      <div className={styles.ordersSection}>
        <h2>Mis Pedidos</h2>
        {orders.length === 0 ? (
          <p>No tienes pedidos aún.</p>
        ) : (
          <ul className={styles.ordersList}>
            {orders.map((order) => (
              <li key={order.id} className={styles.orderItem}>
                <p>
                  <strong>Pedido #{order.id}</strong> - {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p>Estado: {order.status}</p>
                <p>Total: ${order.total.toFixed(2)}</p>
                {/* TODO: Show order items if needed */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}