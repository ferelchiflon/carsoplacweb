import { useState, type ReactNode } from 'react';
import styles from './Layout.module.css';

type NavItem = {
  path: string;
  label: string;
  icon: string;
  badge?: number;
};

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/products', label: 'Productos', icon: '📦', badge: 0 },
  { path: '/categories', label: 'Categorías', icon: '🏷️' },
  { path: '/orders', label: 'Pedidos', icon: '🛒', badge: 0 },
  { path: '/customers', label: 'Clientes', icon: '👥' },
  { path: '/analytics', label: 'Analíticas', icon: '📈' },
  { path: '/settings', label: 'Configuración', icon: '⚙️' },
];

interface LayoutProps {
  children: ReactNode;
  title?: string;
  username?: string;
  userRole?: string;
  currentPath?: string;
}

export default function Layout({
  children,
  title = 'Dashboard',
  username = 'Admin',
  userRole = 'Administrador',
  currentPath = '/',
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const userInitials = username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={styles.layout}>
      {/* Mobile Overlay */}
      <div
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayVisible : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoIcon}>CP</div>
          <div className={styles.sidebarLogoText}>
            <span className={styles.sidebarLogoTitle}>Carso Plac</span>
            <span className={styles.sidebarLogoSubtitle}>Panel Admin</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.sidebarSection}>Principal</div>
          {navItems.slice(0, 4).map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${currentPath === item.path ? styles.navItemActive : ''}`}
              onClick={closeSidebar}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={styles.navBadge}>{item.badge}</span>
              )}
            </a>
          ))}

          <div className={styles.sidebarSection}>Administración</div>
          {navItems.slice(4).map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${currentPath === item.path ? styles.navItemActive : ''}`}
              onClick={closeSidebar}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{userInitials}</div>
            <div>
              <div className={styles.userName}>{username}</div>
              <div className={styles.userRole}>{userRole}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <h1 className={styles.pageTitle}>{title}</h1>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.headerBtn} aria-label="Notifications">
              🔔
              <span className={styles.notificationDot} />
            </button>
            <button className={styles.headerBtn} aria-label="Help">
              ❓
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.contentWide}>{children}</div>
        </div>
      </main>
    </div>
  );
}