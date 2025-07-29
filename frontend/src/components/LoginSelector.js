import React from 'react';

const LoginSelector = ({ onSelect }) => {
  return (
    <div style={{ backgroundColor: 'black', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h2>Select Login Type</h2>
      <button onClick={() => onSelect('consultant')} style={{ padding: '10px 20px', marginBottom: '20px' }}>
        Consultant Login
      </button>
      <button onClick={() => onSelect('admin')} style={{ padding: '10px 20px' }}>
        Admin Login
      </button>
    </div>
  );
};

export default LoginSelector;