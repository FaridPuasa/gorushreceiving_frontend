import React, { useState, useEffect } from 'react';
import GoRushLogo from '../assets/GoRush_Logo.png';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';

const SidebarLayout = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: '📋 Upload Manifest', path: '/upload' },
    { label: '📦 Scan Parcels', path: '/scan' },
    { label: '🚪 Parcels', path: '/manifestscan' }
  ];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Apply global reset styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow-x: hidden;
      }
      #root {
        margin: 0;
        padding: 0;
        height: 100vh;
        width: 100vw;
      }
      a {
        text-decoration: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={styles.mobileHeader}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.menuButton}
          >
            {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
          <div style={styles.mobileLogo}>
            <img 
              src={GoRushLogo} 
              alt="GoRush Logo" 
              style={{ 
                height: '32px',
                width: 'auto'
              }}
            />
          </div>
        </div>
      )}

      {/* Sidebar - Hidden on mobile when closed */}
      <aside style={{
        ...styles.sidebar,
        ...(isMobile ? styles.mobileSidebar : {}),
        ...(isMobile && !sidebarOpen ? { transform: 'translateX(-100%)' } : {})
      }}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            <img 
              src={GoRushLogo} 
              alt="GoRush Logo" 
              style={{ 
                width: isMobile ? '120px' : '150px',
                height: 'auto',
                marginBottom: '16px'
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
                ...(location.pathname === item.path ? styles.navItemActive : {}),
                ...(location.pathname === item.path ? styles.navItemActiveShadow : {})
              }}
            >
              <span style={styles.navIcon}>{item.label.split(' ')[0]}</span>
              <span style={styles.navText}>{item.label.substring(2)}</span>
            </Link>
          ))}
          
          <div style={styles.spacer} />
          
          <button 
            onClick={logout}
            style={styles.logoutButton}
          >
            <span style={styles.navIcon}>🔒</span>
            <span style={styles.navText}>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div 
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div style={{
        ...styles.main,
        ...(isMobile ? styles.mobileMain : {}),
        ...(isMobile && sidebarOpen ? styles.mainWithSidebarOpen : {})
      }}>
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  sidebar: {
    width: '260px',
    height: '100vh',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 20,
    paddingBottom: '20px',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    transition: 'transform 0.3s ease',
  },
  mobileSidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 30,
    boxShadow: '4px 0 15px rgba(0, 0, 0, 0.2)',
  },
  logoContainer: {
    padding: '20px 16px 12px',
    borderBottom: '1px solid #334155',
    position: 'sticky',
    top: 0,
    backgroundColor: '#1e293b',
    zIndex: 1
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    padding: '12px 8px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 14px',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontWeight: '500',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    minHeight: '48px',
    cursor: 'pointer',
    userSelect: 'none',
    ':active': {
      transform: 'scale(0.98)'
    }
  },
  navItemActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontWeight: '600'
  },
  navItemActiveShadow: {
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
  },
  navIcon: {
    fontSize: '20px',
    minWidth: '24px',
    textAlign: 'center'
  },
  navText: {
    fontSize: '15px',
    fontWeight: 'inherit'
  },
  spacer: {
    flex: 1
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 14px',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontWeight: '500',
    fontSize: '16px',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    minHeight: '48px',
    ':active': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      transform: 'scale(0.98)'
    }
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#ffffff',
    WebkitOverflowScrolling: 'touch',
    position: 'relative'
  },
  mobileMain: {
    marginLeft: 0,
    width: '100%'
  },
  mainWithSidebarOpen: {
    overflow: 'hidden'
  },
  mobileHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    backgroundColor: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    zIndex: 25,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '24px',
    marginRight: '16px',
    padding: '8px',
    cursor: 'pointer'
  },
  mobileLogo: {
    height: '32px',
    display: 'flex',
    alignItems: 'center'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 20
  }
};

export default SidebarLayout;