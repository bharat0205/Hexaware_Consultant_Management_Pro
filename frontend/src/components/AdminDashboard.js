import React, { useEffect, useState } from 'react';
import { Tab, Tabs, Box, Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School'; // Training icon

const AdminDashboard = () => {
    const [consultants, setConsultants] = useState([]);
    const [currentTab, setCurrentTab] = useState(0);

    // --- NEW AI SHORTLISTING STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [shortlistResult, setShortlistResult] = useState(null);
    const [listTab, setListTab] = useState(0); // For switching between matching/not matching

    useEffect(() => {
        fetch('http://localhost:5000/consultants').then(res => res.json()).then(data => setConsultants(data));
    }, []);

    const handleTabChange = (event, newValue) => setCurrentTab(newValue);
    const handleListTabChange = (event, newValue) => setListTab(newValue);

    const handleShortlist = () => {
        fetch('http://localhost:5000/admin/shortlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery })
        })
        .then(res => res.json())
        .then(data => setShortlistResult(data));
    };

    const handleAssignTraining = (consultantId) => {
        fetch(`http://localhost:5000/consultants/${consultantId}/assign_training`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skill: searchQuery }) // Assign training for the searched skill
        })
        .then(res => res.json())
        .then(updatedConsultant => {
            // Update the UI to show the training has been assigned
            setShortlistResult(prev => ({
                ...prev,
                not_matching: prev.not_matching.map(c => 
                    c.id === consultantId ? { ...c, training: updatedConsultant.training } : c
                )
            }));
            alert(`${updatedConsultant.name} has been assigned training for: ${searchQuery}`);
        });
    };

    const renderConsultantTable = (data, isNotMatchingList = false) => (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Match Score</TableCell>
                        <TableCell>Current Training</TableCell>
                        {isNotMatchingList && <TableCell>Actions</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map(c => (
                        <TableRow key={c.id}>
                            <TableCell>{c.name}</TableCell>
                            <TableCell>{(c.match_score * 100).toFixed(0)}%</TableCell>
                            <TableCell>{c.training}</TableCell>
                            {isNotMatchingList && (
                                <TableCell>
                                    <Tooltip title={`Assign training for: "${searchQuery}"`}>
                                        <IconButton onClick={() => handleAssignTraining(c.id)}>
                                            <SchoolIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
            <Paper>
                <Tabs value={currentTab} onChange={handleTabChange} centered>
                    <Tab label="AI Shortlisting" />
                    <Tab label="All Consultants" />
                </Tabs>
                {currentTab === 0 && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6">Find the Right Consultant</Typography>
                        <TextField
                            fullWidth
                            label="Describe the skills you need (e.g., 'experience with cloud services and backend databases')"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ my: 2 }}
                        />
                        <Button variant="contained" onClick={handleShortlist}>Shortlist</Button>

                        {shortlistResult && (
                            <Box sx={{ mt: 3 }}>
                                <Tabs value={listTab} onChange={handleListTabChange} centered>
                                    <Tab label={`Matching (${shortlistResult.matching.length})`} />
                                    <Tab label={`Not Matching (${shortlistResult.not_matching.length})`} />
                                </Tabs>
                                {listTab === 0 && renderConsultantTable(shortlistResult.matching)}
                                {listTab === 1 && renderConsultantTable(shortlistResult.not_matching, true)}
                            </Box>
                        )}
                    </Box>
                )}
                {/* ... other tabs like 'All Consultants' and 'Leave Requests' can remain ... */}
            </Paper>
        </Box>
    );
};

export default AdminDashboard;
