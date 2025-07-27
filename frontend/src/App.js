import React, { useState } from 'react';
import ConsultantDashboard from './components/ConsultantDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
    const [view, setView] = useState('');

    return (
        <div 
            style={{ 
                backgroundColor: 'black', 
                color: 'white', 
                minHeight: '100vh', 
                padding: '20px', 
                textAlign: 'center' 
            }}
        >
            <h1>Hexaware Pool Consultant Management System</h1>
            <button 
                onClick={() => setView('consultant')} 
                style={{ 
                    marginRight: '30px', 
                    padding: '12px 24px', 
                    fontSize: '18px',
                    cursor: 'pointer'
                }}
            >
                Consultant Dashboard
            </button>
            <button 
                onClick={() => setView('admin')} 
                style={{ 
                    padding: '12px 24px', 
                    fontSize: '18px',
                    cursor: 'pointer'
                }}
            >
                Admin Dashboard
            </button>

            {view === 'consultant' && <ConsultantDashboard />}
            {view === 'admin' && <AdminDashboard />}
        </div>
    );
}

export default App;
