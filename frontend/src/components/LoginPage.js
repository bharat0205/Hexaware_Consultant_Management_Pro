import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LoginPage = ({ role, onLoginSuccess }) => {
  const [consultants, setConsultants] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (role === 'consultant') {
      axios.get('http://localhost:5000/consultants')
        .then(res => setConsultants(res.data))
        .catch(() => setError('Failed to fetch consultants'));
    }
  }, [role]);

  const handleLogin = async () => {
    if (!selectedId || !email || !password) {
      setError('Please select a consultant and enter email/password');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/login', {
        email, password, consultant_id: selectedId
      });
      onLoginSuccess(response.data);
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div style={{ marginTop: '50px' }}>
      {role === 'consultant' && (
        <>
          <h2>Select Your Name:</h2>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">--Select--</option>
            {consultants.map(c =>
              <option key={c.id} value={c.id}>{c.name}</option>
            )}
          </select>
          <br />
        </>
      )}
      <div style={{ marginTop: '20px' }}>
        <input
          type="text" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
        /><br />
        <input
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
        /><br />
        <button onClick={handleLogin} style={{ padding: '10px 20px', marginTop: '10px' }}>
          Login
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;