import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Button, Box, IconButton, Paper, Grid, Stack } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import ConsultantDashboard from './components/ConsultantDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';

// Import a sample background image URL
const heroImageUrl = 'https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=2070&auto=format&fit=crop';

const App = () => {
    const [view, setView] = useState('home');
    const [loggedInConsultant, setLoggedInConsultant] = useState(null);
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [mode, setMode] = useState('dark');
    const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

    const handleNavigation = (target) => setView(target);
    const handleLoginSuccess = (consultantData) => {
        setLoggedInConsultant(consultantData);
        setView('consultant');
    };
    const handleAdminLoginSuccess = () => setIsAdminLoggedIn(true);

    const handleLogout = () => {
        setLoggedInConsultant(null);
        setIsAdminLoggedIn(false);
        setView('home');
    };

    const renderContent = () => {
        if (view === 'admin') {
            return isAdminLoggedIn ? <AdminDashboard onLogout={handleLogout} /> : <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
        }
        if (view === 'consultant') {
            return loggedInConsultant ? <ConsultantDashboard consultant={loggedInConsultant} onLogout={handleLogout} /> : <Login onLoginSuccess={handleLoginSuccess} />;
        }
        
        // --- NEW HOME PAGE DESIGN ---
        return (
            <Box 
                sx={{
                    flexGrow: 1,
                    p: 4,
                    textAlign: 'center',
                    minHeight: 'calc(100vh - 64px)', // Full height minus app bar
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: `url(${heroImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    '&::before': { // This is an overlay to darken the background image
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        zIndex: 1,
                    }
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 2, color: 'white' }}>
                    <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Consultant Management Portal
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 5, color: 'rgba(255, 255, 255, 0.8)' }}>
                        Streamline operations, track performance, and empower your consultants.
                    </Typography>
                    <Grid container spacing={4} justifyContent="center">
                        <Grid item xs={12} sm={6} md={4}>
                            <Paper elevation={6} sx={{ p: 3, '&:hover': { boxShadow: 12, transform: 'scale(1.02)' }, transition: 'transform 0.2s' }}>
                                <AdminPanelSettingsIcon sx={{ fontSize: 60 }} color="primary" />
                                <Typography variant="h5" sx={{ my: 2 }}>Admin Portal</Typography>
                                <Button variant="contained" onClick={() => handleNavigation('admin')}>Enter Admin Portal</Button>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Paper elevation={6} sx={{ p: 3, '&:hover': { boxShadow: 12, transform: 'scale(1.02)' }, transition: 'transform 0.2s' }}>
                                <PersonIcon sx={{ fontSize: 60 }} color="secondary" />
                                <Typography variant="h5" sx={{ my: 2 }}>Consultant Portal</Typography>
                                <Button variant="contained" color="secondary" onClick={() => handleNavigation('consultant')}>Enter Consultant Portal</Button>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>Hexaware Management</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button color="inherit" onClick={() => handleNavigation('home')}>Home</Button>
                        <Button color="inherit" onClick={() => handleNavigation('admin')}>Admin Portal</Button>
                        <Button color="inherit" onClick={() => handleNavigation('consultant')}>Consultant Portal</Button>
                        <IconButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color="inherit">
                            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>
            <Box component="main">{renderContent()}</Box>
        </ThemeProvider>
    );
};
export default App;
