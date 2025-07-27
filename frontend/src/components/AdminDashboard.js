import React, { useEffect, useState } from 'react';
import { saveAs } from 'file-saver';

const AdminDashboard = () => {
    const [consultants, setConsultants] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [attendanceFilter, setAttendanceFilter] = useState('');
    const [trainingFilter, setTrainingFilter] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/consultants')
            .then(res => res.json())
            .then(data => setConsultants(data));
    }, []);

    const filteredConsultants = consultants.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter ? c.resume_status === statusFilter : true) &&
        (attendanceFilter ? c.attendance === attendanceFilter : true) &&
        (trainingFilter ? c.training === trainingFilter : true)
    );

    const generateReport = () => {
        const csvContent = [
            ["ID", "Name", "Resume Status", "Attendance", "Opportunities", "Training"],
            ...filteredConsultants.map(c => [
                c.id,
                c.name,
                c.resume_status,
                c.attendance,
                c.opportunities,
                c.training
            ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'consultant_report.csv');
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
            <h2>Admin Dashboard</h2>

            {/* 🔍 Search Input */}
            <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '10px', width: '60%', marginBottom: '20px' }}
            />

            {/* 📊 Column Filters */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Resume Status</option>
                    <option value="Updated">Updated</option>
                    <option value="Not Updated">Not Updated</option>
                </select>

                <select value={attendanceFilter} onChange={e => setAttendanceFilter(e.target.value)}>
                    <option value="">All Attendance</option>
                    <option value="Completed">Completed</option>
                    <option value="Not Completed">Not Completed</option>
                </select>

                <select value={trainingFilter} onChange={e => setTrainingFilter(e.target.value)}>
                    <option value="">All Training</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                </select>
            </div>

            {/* 📥 CSV Button */}
            <button onClick={generateReport} style={{ padding: '10px 20px', marginBottom: '20px' }}>
                Generate Report (CSV)
            </button>

            {/* 🧾 Data Table */}
            <table style={{ 
                width: '80%', 
                margin: '20px auto', 
                borderCollapse: 'collapse', 
                border: '2px solid white',
                backgroundColor: 'black',
                color: 'white'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#000000ff' }}>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Resume Status</th>
                        <th>Attendance</th>
                        <th>Opportunities</th>
                        <th>Training</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredConsultants.map(c => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.name}</td>
                            <td style={{ color: c.resume_status === 'Updated' ? 'green' : 'red' }}>
                                {c.resume_status}
                            </td>
                            <td style={{ color: c.attendance === 'Completed' ? 'green' : 'red' }}>
                                {c.attendance}
                            </td>
                            <td>{c.opportunities}</td>
                            <td style={{ color: c.training === 'Completed' ? 'green' : 'orange' }}>
                                {c.training}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;
