import React, { useState } from 'react';
import ConsultantDashboard from './components/ConsultantDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const AppContent = () => {
  const [view, setView] = useState('');
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      minHeight: '100vh',
      backgroundColor: darkMode ? 'black' : '#f0f0f0',
      color: darkMode ? 'white' : 'black'
    }}>
      <h1>Hexaware Pool Consultant Management System</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setView('consultant')} style={{ marginRight: '10px' }}>Consultant Dashboard</button>
        <button onClick={() => setView('admin')} style={{ marginRight: '10px' }}>Admin Dashboard</button>
        <button onClick={toggleTheme} style={{
          padding: '8px 12px',
          borderRadius: '8px',
          background: darkMode ? '#333' : '#ccc',
          color: darkMode ? '#fff' : '#000',
          border: 'none',
          cursor: 'pointer'
        }}>
          {darkMode ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>

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