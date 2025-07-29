import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggleButton = () => {
    const { darkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: '2px solid #ccc',
                backgroundColor: darkMode ? '#444' : '#eee',
                color: darkMode ? '#fff' : '#000',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                margin: '10px',
                transition: 'all 0.3s ease'
            }}
        >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
    );
};

export default ThemeToggleButton;
