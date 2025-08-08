import React, { useState } from 'react';
import ConsultantDashboard from './components/ConsultantDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { FiMenu, FiSun, FiMoon } from 'react-icons/fi';
import { FaUserTie, FaShieldAlt } from 'react-icons/fa';

const AppContent = () => {
  const [view, setView] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  const handleNavigation = (target) => {
    setView(target);
    setMenuOpen(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#121212' : '#f8f9fa',
        color: darkMode ? '#ffffff' : '#000000',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Navbar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          borderBottom: darkMode ? '1px solid #333' : '1px solid #ddd'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiMenu
            size={24}
            style={{ cursor: 'pointer' }}
            onClick={() => setMenuOpen(!menuOpen)}
          />
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Hexaware</span>
        </div>
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: darkMode ? '#fff' : '#000'
          }}
        >
          {darkMode ? <FiMoon /> : <FiSun />}
        </button>
      </header>

      {/* Hamburger Menu */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            left: '10px',
            background: darkMode ? '#1f1f1f' : '#ffffff',
            border: darkMode ? '1px solid #333' : '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            padding: '10px',
            width: '200px'
          }}
        >
          <div
            style={{ padding: '10px', cursor: 'pointer' }}
            onClick={() => handleNavigation('home')}
          >
            Home
          </div>
          <div
            style={{ padding: '10px', cursor: 'pointer' }}
            onClick={() => handleNavigation('consultant')}
          >
            Consultant Dashboard
          </div>
          <div
            style={{ padding: '10px', cursor: 'pointer' }}
            onClick={() => handleNavigation('admin')}
          >
            Admin Dashboard
          </div>
        </div>
      )}

      {/* Main Content */}
      {view === 'home' && (
        <main style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '5px 15px',
              background: darkMode ? '#2d2d2d' : '#e9ecef',
              borderRadius: '20px',
              fontSize: '12px',
              marginBottom: '10px'
            }}
          >
            Enterprise Solution
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>
            Consultant Management System
          </h1>
          <p
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              fontSize: '16px',
              color: darkMode ? '#cccccc' : '#555555'
            }}
          >
            Streamline your consultant operations with our comprehensive management platform. Access
            powerful dashboards, manage resources, and optimize your workforce efficiency.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '30px',
              flexWrap: 'wrap'
            }}
          >
            {/* Consultant Card */}
            <div
              style={{
                background: darkMode ? '#1f1f1f' : '#ffffff',
                borderRadius: '10px',
                padding: '20px',
                width: '280px',
                textAlign: 'center',
                border: darkMode ? '1px solid #333' : '1px solid #ddd'
              }}
            >
              <FaUserTie size={40} color="#4e73df" style={{ marginBottom: '10px' }} />
              <h3 style={{ marginBottom: '5px' }}>Consultant Portal</h3>
              <p style={{ fontSize: '14px', color: darkMode ? '#cccccc' : '#666666' }}>
                View assignments, track progress, manage availability, and access resources tailored for consultants.
              </p>
              <button
                onClick={() => setView('consultant')}
                style={{
                  marginTop: '15px',
                  background: '#4e73df',
                  color: '#fff',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Access Consultant Dashboard
              </button>
            </div>

            {/* Admin Card */}
            <div
              style={{
                background: darkMode ? '#1f1f1f' : '#ffffff',
                borderRadius: '10px',
                padding: '20px',
                width: '280px',
                textAlign: 'center',
                border: darkMode ? '1px solid #333' : '1px solid #ddd'
              }}
            >
              <FaShieldAlt size={40} color="#1cc88a" style={{ marginBottom: '10px' }} />
              <h3 style={{ marginBottom: '5px' }}>Admin Portal</h3>
              <p style={{ fontSize: '14px', color: darkMode ? '#cccccc' : '#666666' }}>
                Manage consultants, oversee projects, generate reports, and maintain full system control.
              </p>
              <button
                onClick={() => setView('admin')}
                style={{
                  marginTop: '15px',
                  background: '#1cc88a',
                  color: '#fff',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Access Admin Dashboard
              </button>
            </div>
          </div>
        </main>
      )}

      {view === 'consultant' && <ConsultantDashboard />}
      {view === 'admin' && <AdminDashboard />}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
