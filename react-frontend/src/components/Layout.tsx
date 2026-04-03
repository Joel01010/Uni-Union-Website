import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/lending', label: 'LendLink', icon: '🤝' },
    { path: '/locator', label: 'RoomRadar', icon: '🏠' },
    { path: '/refind', label: 'ReFind', icon: '🔍' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  const currentPath = location.pathname;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Sidebar */}
      <nav style={{
        width: '280px',
        backgroundColor: '#1A1A1A',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
      }}>
        {/* Logo/Title */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #333',
          marginBottom: '20px'
        }}>
          <h1 style={{
            color: '#EF2D2D',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
            textAlign: 'center'
          }}>
            UniUnion
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            textAlign: 'center',
            margin: '5px 0 0 0',
            letterSpacing: '1px'
          }}>
            BORROW. RETURN. TRUST.
          </p>
        </div>

        {/* Navigation Items */}
        <div style={{ flex: 1 }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: currentPath === item.path ? '#EF2D2D' : 'transparent',
                border: 'none',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
                transition: 'background-color 0.2s',
                borderLeft: currentPath === item.path ? '4px solid #ff6b6b' : '4px solid transparent'
              }}
            >
              <span style={{ fontSize: '20px', marginRight: '12px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '30px',
        backgroundColor: '#ffffff',
        overflowY: 'auto'
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;