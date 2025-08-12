import React, { useEffect, useState } from 'react';
import { Tab, Tabs, Box, Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Modal, Grid } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ReplayIcon from '@mui/icons-material/Replay';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// --- This Edit Modal Component is unchanged but required for the file ---
const EditConsultantModal = ({ open, onClose, consultant, onSave }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (consultant) {
            setFormData(consultant);
        }
    }, [consultant]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, }}>
                <Typography variant="h6" component="h2">Edit Consultant</Typography>
                {formData && (
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={6}><TextField fullWidth label="Name" name="name" value={formData.name || ''} onChange={handleChange} /></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Username" name="username" value={formData.username || ''} onChange={handleChange} /></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline rows={4} label="Resume Text" name="resume_text" value={formData.resume_text || ''} onChange={handleChange} /></Grid>
                        <Grid item xs={12}><Button variant="contained" onClick={handleSave}>Save Changes</Button></Grid>
                    </Grid>
                )}
            </Box>
        </Modal>
    );
};


const AdminDashboard = () => {
    const [consultants, setConsultants] = useState([]);
    const [currentTab, setCurrentTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [shortlistResult, setShortlistResult] = useState(null);
    const [listTab, setListTab] = useState(0);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedConsultant, setSelectedConsultant] = useState(null);

    const fetchConsultants = () => {
        fetch('http://localhost:5000/consultants').then(res => res.json()).then(setConsultants);
    };

    useEffect(() => {
        fetchConsultants();
    }, []);

    const handleTabChange = (event, newValue) => setCurrentTab(newValue);
    const handleListTabChange = (event, newValue) => setListTab(newValue);
    const handleOpenEditModal = (consultant) => {
        setSelectedConsultant(consultant);
        setEditModalOpen(true);
    };
    const handleCloseEditModal = () => setEditModalOpen(false);

    const handleShortlist = () => {
        fetch('http://localhost:5000/admin/shortlist', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery })
        })
        .then(res => res.json()).then(setShortlistResult);
    };
    
    const updateShortlistUI = (updatedConsultant) => {
        const updateList = (list) => list.map(item => item.consultant.id === updatedConsultant.id ? { ...item, consultant: updatedConsultant } : item);
        setShortlistResult(prev => ({
            matching: prev ? updateList(prev.matching) : [],
            not_matching: prev ? updateList(prev.not_matching) : []
        }));
    };

    const handleAssignTraining = (id) => {
        fetch(`http://localhost:5000/consultants/${id}/assign_training`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: searchQuery })
        }).then(res => res.json()).then(updateShortlistUI);
    };

    const handleUnassignTraining = (id) => {
        fetch(`http://localhost:5000/consultants/${id}/unassign_training`, { method: 'POST' })
        .then(res => res.json()).then(updateShortlistUI);
    };
    
    // --- FIX: THIS IS THE CORRECTED DELETE FUNCTION ---
    const handleDeleteConsultant = (id) => {
        if (window.confirm("Are you sure? This action cannot be undone.")) {
            fetch(`http://localhost:5000/consultants/${id}`, { method: 'DELETE' })
            .then(res => {
                if(res.ok) {
                    // Re-fetch the consultants list to update the UI instantly
                    fetchConsultants(); 
                } else {
                    alert("Failed to delete consultant.");
                }
            });
        }
    };
    
    const handleSaveChanges = (updatedData) => {
        fetch(`http://localhost:5000/consultants/${updatedData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        })
        .then(res => {
            if (res.ok) {
                fetchConsultants();
                handleCloseEditModal();
            } else {
                alert("Failed to save changes.");
            }
        });
    };

    const renderShortlistTable = (data) => (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Match Score</TableCell><TableCell>Training Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>
                    {data.map((item) => ( // --- FIX: Changed destructuring to use 'item' to avoid error
                        <TableRow key={item.consultant.id}>
                            <TableCell>{item.consultant.name}</TableCell>
                            <TableCell>{(item.score * 100).toFixed(0)}%</TableCell>
                            <TableCell>{item.consultant.training}</TableCell>
                            <TableCell>
                                <Tooltip title={`Assign training for: "${searchQuery}"`}><IconButton onClick={() => handleAssignTraining(item.consultant.id)}><SchoolIcon /></IconButton></Tooltip>
                                <Tooltip title="Unassign Training"><IconButton onClick={() => handleUnassignTraining(item.consultant.id)}><ReplayIcon /></IconButton></Tooltip>
                            </TableCell>
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
                    <Tab label="Manage Consultants" />
                </Tabs>
                {currentTab === 0 && (
                    <Box sx={{ p: 2 }}>
                        <TextField fullWidth label="Describe skills needed (e.g., 'React frontend developer')" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ my: 2 }}/>
                        <Button variant="contained" onClick={handleShortlist}>Shortlist</Button>
                        {shortlistResult && (
                            <Box sx={{ mt: 3 }}>
                                <Tabs value={listTab} onChange={handleListTabChange} centered>
                                    <Tab label={`Matching (${shortlistResult.matching.length})`} />
                                    <Tab label={`Not Matching (${shortlistResult.not_matching.length})`} />
                                </Tabs>
                                {listTab === 0 && renderShortlistTable(shortlistResult.matching)}
                                {listTab === 1 && renderShortlistTable(shortlistResult.not_matching)}
                            </Box>
                        )}
                    </Box>
                )}
                {currentTab === 1 && (
                    <TableContainer>
                        <Table>
                            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Username</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                            <TableBody>
                                {consultants.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell>{c.name}</TableCell><TableCell>{c.username}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit"><IconButton onClick={() => handleOpenEditModal(c)}><EditIcon /></IconButton></Tooltip>
                                            <Tooltip title="Delete"><IconButton onClick={() => handleDeleteConsultant(c.id)}><DeleteIcon /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
            <EditConsultantModal open={editModalOpen} onClose={handleCloseEditModal} consultant={selectedConsultant} onSave={handleSaveChanges} />
        </Box>
    );
};

export default AdminDashboard;
