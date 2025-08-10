import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ConsultantDashboard from './components/ConsultantDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

const App = () => {
    const [view, setView] = useState('home');
    const [loggedInConsultant, setLoggedInConsultant] = useState(null);
    const [mode, setMode] = useState('dark'); // 'dark' or 'light'

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
        },
    }), [mode]);

    const handleNavigation = (target) => {
        if (target === 'home') {
            setLoggedInConsultant(null);
        }
        setView(target);
    };
    
    const handleLoginSuccess = (consultantData) => {
        setLoggedInConsultant(consultantData);
        setView('consultant');
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Hexaware Management
                    </Typography>
                    <Button color="inherit" onClick={() => handleNavigation('home')}>Home</Button>
                    <Button color="inherit" onClick={() => handleNavigation('admin')}>Admin Portal</Button>
                    <Button color="inherit" onClick={() => handleNavigation('consultant')}>Consultant Portal</Button>
                    <IconButton sx={{ ml: 1 }} onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color="inherit">
                        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Box component="main">
                {view === 'home' && (
                    <Box sx={{ textAlign: 'center', p: 5 }}>
                        <Typography variant="h3" gutterBottom>Welcome to the Management System</Typography>
                    </Box>
                )}
                {view === 'admin' && <AdminDashboard />}
                {view === 'consultant' && (
                    !loggedInConsultant ? (
                        <Login onLoginSuccess={handleLoginSuccess} />
                    ) : (
                        <ConsultantDashboard consultant={loggedInConsultant} />
                    )
                )}
            </Box>
        </ThemeProvider>
    );
};

export default App;
