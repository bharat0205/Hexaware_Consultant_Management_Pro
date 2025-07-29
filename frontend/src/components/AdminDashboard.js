import React, { useEffect, useState, useContext } from 'react';
import { saveAs } from 'file-saver';
import { useTheme } from '../context/ThemeContext';

const AdminDashboard = () => {
  const [consultants, setConsultants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('');
  const [trainingFilter, setTrainingFilter] = useState('');
  const { darkMode, toggleTheme } = useTheme();

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
    <div style={{
      padding: '20px',
      textAlign: 'center',
      backgroundColor: darkMode ? 'black' : 'white',
      color: darkMode ? 'white' : 'black',
      minHeight: '100vh'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin Dashboard</h2>
        <button onClick={toggleTheme} style={{
          padding: '8px 12px',
          borderRadius: '8px',
          background: darkMode ? '#333' : '#ccc',
          color: darkMode ? '#fff' : '#000',
          border: 'none',
          cursor: 'pointer'
        }}>
          {darkMode ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: '10px', width: '60%', marginBottom: '20px' }}
      />

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

      <button onClick={generateReport} style={{ padding: '10px 20px', marginBottom: '20px' }}>
        Generate Report (CSV)
      </button>

      <table style={{
        width: '80%',
        margin: '20px auto',
        borderCollapse: 'collapse',
        border: `2px solid ${darkMode ? 'white' : 'black'}`
      }}>
        <thead>
          <tr style={{ backgroundColor: darkMode ? '#222' : '#ddd', color: darkMode ? 'white' : 'black' }}>
            <th>ID</th>
            <th>Name</th>
            <th>Resume Status</th>
            <th>Attendance</th>
            <th>Opportunities</th>
            <th>Training</th>
            <th>Resume Upload Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredConsultants.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td style={{ color: c.resume_status === 'Updated' ? 'lightgreen' : 'red' }}>{c.resume_status}</td>
              <td style={{ color: c.attendance === 'Completed' ? 'lightgreen' : 'red' }}>{c.attendance}</td>
              <td>{c.opportunities}</td>
              <td style={{ color: c.training === 'Completed' ? 'lightgreen' : 'orange' }}>{c.training}</td>
              <td style={{ fontStyle: 'italic', fontSize: '12px' }}>
                {c.resume_upload_date ? new Date(c.resume_upload_date).toLocaleString() : 'Not Uploaded'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;