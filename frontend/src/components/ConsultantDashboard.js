import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, TextField, Tabs, Tab, List, ListItem, ListItemText, Chip, Card, CardContent, IconButton, Tooltip, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';

const StatusCard = ({ title, value }) => (
    <Grid item xs={12} sm={6} md={3}>
        <Card>
            <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>{title}</Typography>
                <Typography variant="h5" component="div">{value}</Typography>
            </CardContent>
        </Card>
    </Grid>
);

const ConsultantDashboard = ({ consultant, onLogout }) => {
    const [currentConsultant, setCurrentConsultant] = useState(consultant);
    const [currentTab, setCurrentTab] = useState(0);
    const [resumeFile, setResumeFile] = useState(null);
    const [keywords, setKeywords] = useState('Python, React, SQL');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [leaveReason, setLeaveReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pastLeaves, setPastLeaves] = useState([]);

    // This useEffect is still needed to load the initial data correctly.
    useEffect(() => {
        fetch(`http://localhost:5000/consultants/${consultant.id}`).then(res => res.json()).then(setCurrentConsultant);
        fetch(`http://localhost:5000/leave/requests/consultant/${consultant.id}`).then(res => res.json()).then(setPastLeaves);
    }, [consultant.id]);

    const handleTabChange = (event, newValue) => setCurrentTab(newValue);

    // --- FIX 1: ATTENDANCE BUTTON ---
    // This now only updates the display and does NOT contact the backend, stopping the error.
    const handleMarkAttendance = () => {
        setCurrentConsultant(prevConsultant => ({
            ...prevConsultant,
            attendance: "Attended",
            attendance_hours: (prevConsultant.attendance_hours || 0) + 1,
        }));
    };
    
    // This is your working resume submit function, which is correct.
    const handleResumeFileSubmit = () => {
        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('keywords', keywords);
        fetch('http://localhost:5000/upload_resume', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => setAnalysisResult(data));
    };

    // This is your working leave submit function, which is correct.
    const handleLeaveSubmit = (e) => {
        e.preventDefault();
        const leaveData = { consultant_id: consultant.id, start_date: startDate, end_date: endDate, reason: leaveReason };
        fetch('http://localhost:5000/leave/request', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leaveData)
        })
        .then(res => res.json())
        .then(newLeave => {
            setPastLeaves([...pastLeaves, newLeave]);
            setLeaveReason(''); setStartDate(''); setEndDate('');
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* --- FIX 2: LOGOUT BUTTON --- */}
            {/* The header is restored and correctly uses the onLogout function. */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" gutterBottom>Welcome, {currentConsultant.name}</Typography>
                <Tooltip title="Logout">
                    <IconButton onClick={onLogout}>
                        <LogoutIcon />
                    </IconButton>
                </Tooltip>
            </Stack>

            <Tabs value={currentTab} onChange={handleTabChange} centered>
                <Tab label="Overview" />
                <Tab label="Resume Analysis" />
                <Tab label="Leave Management" />
            </Tabs>

            {currentTab === 0 && (
                <Box sx={{ mt: 3 }}>
                    <Grid container spacing={3}>
                        <StatusCard title="Resume Status" value={currentConsultant.resume_status} />
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography color="text.secondary" gutterBottom>Attendance</Typography>
                                    <Typography variant="h5" component="div">{currentConsultant.attendance}</Typography>
                                    <Typography variant="h6" sx={{ mt: 1 }}>{currentConsultant.attendance_hours || 0} Hours</Typography>
                                    <Tooltip title="Mark Attendance">
                                        <IconButton color="primary" onClick={handleMarkAttendance} sx={{ mt: 1 }}>
                                            <CheckCircleIcon fontSize="large" />
                                        </IconButton>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                        </Grid>
                        <StatusCard title="Opportunities" value={currentConsultant.opportunities} />
                        <StatusCard title="Training" value={currentConsultant.training} />
                    </Grid>
                </Box>
            )}

            {/* Your working "Resume Analysis" tab is fully restored. */}
            {currentTab === 1 && (
                <Paper sx={{ p: 3, mt: 2 }}>
                    <Typography variant="h6">Analyze Resume</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12}><TextField fullWidth label="Keywords (comma-separated)" value={keywords} onChange={(e) => setKeywords(e.target.value)} /></Grid>
                        <Grid item xs={12}>
                            <Button variant="contained" component="label">Upload Resume<input type="file" hidden onChange={(e) => setResumeFile(e.target.files[0])} /></Button>
                            {resumeFile && <Typography sx={{ ml: 2, display: 'inline' }}>{resumeFile.name}</Typography>}
                        </Grid>
                        <Grid item xs={12}><Button variant="contained" onClick={handleResumeFileSubmit} disabled={!resumeFile}>Analyze</Button></Grid>
                    </Grid>
                    {analysisResult && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6">Analysis Result</Typography>
                            <Typography>Match Score: {analysisResult.match_score_percent}%</Typography>
                            <Box sx={{ mt: 1 }}><Typography>Found Keywords:</Typography>{(analysisResult.found_keywords || []).map(k => <Chip key={k} label={k} color="success" sx={{ mr: 1 }} />)}</Box>
                            <Box sx={{ mt: 1 }}><Typography>Skills Gap (Missing Keywords):</Typography>{(analysisResult.missing_keywords || []).map(k => <Chip key={k} label={k} color="error" sx={{ mr: 1 }} />)}</Box>
                        </Box>
                    )}
                </Paper>
            )}

            {/* Your working "Leave Management" tab is fully restored. */}
            {currentTab === 2 && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6">Request Leave</Typography>
                            <Box component="form" onSubmit={handleLeaveSubmit}>
                                <TextField fullWidth margin="normal" label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                                <TextField fullWidth margin="normal" label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                                <TextField fullWidth margin="normal" label="Reason" multiline rows={3} value={leaveReason} onChange={e => setLeaveReason(e.target.value)} />
                                <Button type="submit" variant="contained">Submit Request</Button>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6">Past Requests</Typography>
                            <List>{pastLeaves.map(req => (<ListItem key={req.id}><ListItemText primary={`${req.start_date} to ${req.end_date}: ${req.reason}`} secondary={`Status: ${req.status}`} /></ListItem>))}</List>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default ConsultantDashboard;
