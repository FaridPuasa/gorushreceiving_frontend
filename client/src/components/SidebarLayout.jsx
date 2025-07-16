import React from 'react';
import GoRushLogo from '../assets/GoRush_Logo.png';
import { Link, Outlet, useLocation } from 'react-router-dom';

const SidebarLayout = () => {
  const location = useLocation();

  const navItems = [
    { label: '📋 Upload Manifest', path: '/upload' },
    { label: '📦 Scan Parcels', path: '/scan' },
    { label: '🚪 Parcels', path: '/manifestscan' }
  ];

  // Apply global reset styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
      }
      #root {
        margin: 0;
        padding: 0;
        height: 100vh;
        width: 100vw;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            <img 
              src={GoRushLogo} 
              alt="GoRush Logo" 
              style={{ 
                width: '150px',
                height: 'auto',
                marginBottom: '10px'
              }}
            />
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navItemActive : {})
              }}
            >
              <span style={styles.navIcon}>{item.label.split(' ')[0]}</span>
              <span style={styles.navText}>{item.label.substring(2)}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div style={styles.main}>
        <Outlet />
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  sidebar: {
    width: '280px',
    height: '100vh',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
    position: 'relative',
    zIndex: 10,
  },
  logoContainer: {
    padding: '16px',
    borderBottom: '1px solid #334155'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center'
  },
  logoIcon: {
    fontSize: '28px',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    padding: '12px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    color: '#cbd5e1',
    fontWeight: '500',
    fontSize: '15px',
    transition: 'all 0.2s ease',
  },
  navItemActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
  },
  navIcon: {
    fontSize: '18px',
    minWidth: '20px',
    textAlign: 'center'
  },
  navText: {
    fontSize: '15px',
    fontWeight: '500'
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#ffffff',
    margin: 0,
    padding: 0
  }
};

export default SidebarLayout;