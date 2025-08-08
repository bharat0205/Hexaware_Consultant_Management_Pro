import React, { useState } from 'react';
import ConsultantDashboard from './components/ConsultantDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const HomePage = ({ setView }) => {
  const { darkMode } = useTheme();

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px',
        minHeight: '100vh',
        backgroundColor: darkMode ? '#121212' : '#f0f0f0',
        color: darkMode ? 'white' : 'black',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>
        Hexaware Pool Consultant Management System
      </h1>
      <p style={{ marginBottom: '40px' }}>
        Choose your portal to continue
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
        <div
          style={{
            background: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            width: '220px',
          }}
        >
          <h3>Consultant Portal</h3>
          <p>Access consultant resources</p>
          <button
            onClick={() => setView('consultant')}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Go
          </button>
        </div>

        <div
          style={{
            background: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            width: '220px',
          }}
        >
          <h3>Admin Portal</h3>
          <p>Manage consultants & data</p>
          <button
            onClick={() => setView('admin')}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const [view, setView] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Hamburger Icon */}
      <div
        style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          cursor: 'pointer',
          color: darkMode ? '#fff' : '#000',
          fontSize: '28px',
          zIndex: 1000,
        }}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </div>

      {/* Side Menu */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            height: '100%',
            width: '200px',
            background: darkMode ? '#1e1e1e' : '#f8f8f8',
            paddingTop: '60px',
            boxShadow: '2px 0 5px rgba(0,0,0,0.2)',
            zIndex: 999,
          }}
        >
          <div
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              borderBottom: '1px solid #ccc',
            }}
            onClick={() => {
              setView('home');
              setMenuOpen(false);
            }}
          >
            🏠 Home
          </div>
          <div
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              borderBottom: '1px solid #ccc',
            }}
            onClick={() => {
              setView('admin');
              setMenuOpen(false);
            }}
          >
            👨‍💼 Admin
          </div>
          <div
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
            }}
            onClick={() => {
              setView('consultant');
              setMenuOpen(false);
            }}
          >
            👩‍💼 Consultant
          </div>
          <div
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              marginTop: '20px',
            }}
            onClick={() => toggleTheme()}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </div>
        </div>
      )}

      {/* Main Content */}
      {view === 'home' && <HomePage setView={setView} />}
      {view === 'admin' && <AdminDashboard />}
      {view === 'consultant' && <ConsultantDashboard />}
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
