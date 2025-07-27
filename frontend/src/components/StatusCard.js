import React from 'react';

const StatusCard = ({ title, value, color }) => {
    return (
        <div style={{
            border: `3px solid ${color}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            width: '180px',
            margin: '12px',
            boxShadow: `0 0 10px ${color}33`,
            backgroundColor: '#fff',
            transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
            <h3 style={{ marginBottom: '10px', color: 'black' }}>{title}</h3>
            <p style={{ fontSize: '1.7rem', fontWeight: 'bold', color: color }}>{value}</p>
        </div>
    );
};

export default StatusCard;
