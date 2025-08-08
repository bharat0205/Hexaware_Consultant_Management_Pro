import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../context/ThemeContext';

const ConsultantDashboard = () => {
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [resumeUploadDate, setResumeUploadDate] = useState('');
  const [file, setFile] = useState(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    fetch('http://localhost:5000/consultants')
      .then(res => res.json())
      .then(data => setConsultants(data));
  }, []);

  const handleAction = (field, value) => {
    fetch(`http://localhost:5000/consultants/${selectedConsultant}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    }).then(() => {
      alert(`${field} updated successfully`);
    });
  };

  const handleFileUpload = () => {
    const formData = new FormData();
    formData.append('resume', file);

    fetch(`http://localhost:5000/consultants/${selectedConsultant}/upload`, {
      method: 'POST',
      body: formData
    }).then(() => {
      alert('Resume uploaded successfully');
    });
  };

  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: darkMode ? '#000' : '#fff',
        color: darkMode ? '#fff' : '#000',
        minHeight: '100vh'
      }}
    >
      <h2>Consultant Dashboard</h2>

      <select
        value={selectedConsultant}
        onChange={(e) => setSelectedConsultant(e.target.value)}
      >
        <option value="">Select Consultant</option>
        {consultants.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {selectedConsultant && (
        <>
          <p>
            <strong>Resume Last Uploaded:</strong> {resumeUploadDate || 'Not Uploaded'}
          </p>

          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => handleAction('resume_status', 'Updated')}>
              Mark Resume as Updated
            </button>
            <button onClick={() => handleAction('attendance', 'Completed')}>
              Mark Attendance as Completed
            </button>
            <button onClick={() => handleAction('opportunities', 'Add')}>
              Add Opportunity
            </button>
            <button onClick={() => handleAction('training', 'Completed')}>
              Mark Training as Completed
            </button>
          </div>

          <h3>Upload Resume</h3>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={handleFileUpload}>Submit</button>
        </>
      )}
    </div>
  );
};

export default ConsultantDashboard;
