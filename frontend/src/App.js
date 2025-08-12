import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ConsultantDashboard from './components/ConsultantDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';

const App = () => {
    const [view, setView] = useState('home');
    const [loggedInConsultant, setLoggedInConsultant] = useState(null);
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [mode, setMode] = useState('dark');

    const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

    const handleNavigation = (target) => {
        // --- FIX: THIS LOGIC ENSURES LOGOUTS WORK CORRECTLY ---
        if (target === 'home') {
            setLoggedInConsultant(null);
            setIsAdminLoggedIn(false);
        }
        setView(target);
    };

    const handleLoginSuccess = (consultantData) => {
        setLoggedInConsultant(consultantData);
        setView('consultant');
    };
    
    const handleAdminLoginSuccess = () => {
        setIsAdminLoggedIn(true);
        // The view is already 'admin', so we just need to trigger a re-render
        // by setting the state. The renderContent function will then show the dashboard.
    };

    // --- FIX: THIS IS THE CORRECTED LOGIC FOR RENDERING CONTENT ---
    const renderContent = () => {
        if (view === 'admin') {
            // If the view is 'admin', check if the admin is logged in.
            // If they are, show the dashboard. If not, show the login page.
            return isAdminLoggedIn ? <AdminDashboard /> : <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
        }
        if (view === 'consultant') {
            return loggedInConsultant ? <ConsultantDashboard consultant={loggedInConsultant} /> : <Login onLoginSuccess={handleLoginSuccess} />;
        }
        // Default to home page
        return (
            <Box sx={{ textAlign: 'center', p: 5 }}>
                <Typography variant="h3" gutterBottom>Welcome to the Management System</Typography>
                <Typography>Please select your portal to continue.</Typography>
            </Box>
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>Hexaware Management</Typography>
                    <Button color="inherit" onClick={() => handleNavigation('home')}>Home</Button>
                    <Button color="inherit" onClick={() => handleNavigation('admin')}>Admin Portal</Button>
                    <Button color="inherit" onClick={() => handleNavigation('consultant')}>Consultant Portal</Button>
                    <IconButton sx={{ ml: 1 }} onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color="inherit">
                        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Box component="main">{renderContent()}</Box>
        </ThemeProvider>
    );
};

export default App;
