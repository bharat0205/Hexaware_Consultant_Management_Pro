import React, { useEffect, useState } from 'react';
import StatusCard from './StatusCard';
import { useTheme } from '../context/ThemeContext';

const ConsultantDashboard = () => {
    const [consultants, setConsultants] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [skillVector, setSkillVector] = useState('');
    const [feedback, setFeedback] = useState('');
    const { darkMode, toggleTheme } = useTheme();

    const formatSkills = (skills) => {
        if (!skills) return "";
        return skills
            .replace(/technical_skills:/i, "\n\n<b>Technical Skills:</b>")
            .replace(/soft_skills:/i, "\n\n<b>Soft Skills:</b>")
            .trim();
    };

    const calculateProgress = (consultant) => {
        let progress = 0;
        if (consultant.resume_status === "Updated") progress += 25;
        if (consultant.attendance === "Completed") progress += 25;
        if (consultant.opportunities > 0) progress += 25;
        if (consultant.training === "Completed") progress += 25;
        return progress;
    };

    useEffect(() => {
        fetch('http://localhost:5000/consultants')
            .then(res => res.json())
            .then(data => setConsultants(data));
    }, []);

    const handleSelect = (e) => {
        const id = e.target.value;
        setSelectedId(id);
        const consultant = consultants.find(c => c.id === parseInt(id));
        setSelectedConsultant(consultant);
    };

    const updateConsultant = (field, value) => {
        fetch(`http://localhost:5000/consultants/${selectedConsultant.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
        })
            .then(res => res.json())
            .then(data => {
                setSelectedConsultant(data);
                const updatedList = consultants.map(c =>
                    c.id === data.id ? data : c
                );
                setConsultants(updatedList);
            });
    };

    const handleResumeFileSubmit = () => {
        if (!resumeFile) {
            setUploadMessage("❌ Please select a PDF file first.");
            return;
        }

        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('email', selectedConsultant.email);

        setUploadMessage("✅ Resume submitted. Processing...");

        fetch('http://localhost:5000/upload_resume', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.skill_vector) {
                    setSkillVector(data.skill_vector);
                    setUploadMessage("✅ Resume submitted and analyzed successfully.");
                } else if (data.error) {
                    setSkillVector(`❌ Error: ${data.error}`);
                    setUploadMessage("❌ Error occurred during processing.");
                }
            })
            .catch(err => {
                setSkillVector(`❌ Error: ${err.message}`);
                setUploadMessage("❌ Error occurred during processing.");
            });
    };

    const generateFeedback = () => {
        fetch('http://localhost:5000/generate_feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills: skillVector })
        })
            .then(res => res.json())
            .then(data => {
                setFeedback(data.feedback || 'No feedback generated.');
            })
            .catch(err => {
                setFeedback(`❌ Error generating feedback: ${err.message}`);
            });
    };

    return (
        <div style={{
            padding: '20px',
            textAlign: 'center',
            backgroundColor: darkMode ? 'black' : 'white',
            color: darkMode ? 'white' : 'black',
            minHeight: '100vh'
        }}>
            <div style={{ textAlign: 'right' }}>
                <button onClick={toggleTheme} style={{
                    padding: '8px 15px',
                    borderRadius: '20px',
                    backgroundColor: darkMode ? '#444' : '#ccc',
                    color: darkMode ? 'white' : 'black',
                    border: 'none',
                    fontWeight: 'bold'
                }}>
                    {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </button>
            </div>
            <h2>Consultant Dashboard</h2>
            <select value={selectedId} onChange={handleSelect}>
                <option value="">Select Consultant</option>
                {consultants.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>

            {selectedConsultant && (
                <div>
                    <p><strong>Resume Last Uploaded:</strong> {selectedConsultant.resume_upload_date || "Not Uploaded"}</p>
                    <div style={{ marginTop: '20px' }}>
                        <button onClick={() => updateConsultant('resume_status', 'Updated')}>Mark Resume as Updated</button>
                        <button onClick={() => updateConsultant('attendance', 'Completed')}>Mark Attendance as Completed</button>
                        <button onClick={() => updateConsultant('opportunities', selectedConsultant.opportunities + 1)}>Add Opportunity</button>
                        <button onClick={() => updateConsultant('training', 'Completed')}>Mark Training as Completed</button>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <h3>Upload Resume</h3>
                        <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} />
                        <button onClick={handleResumeFileSubmit} style={{ marginLeft: '10px' }}>Submit</button>
                        <p>{uploadMessage}</p>
                    </div>
                    {skillVector && (
                        <div>
                            <h4>Extracted Skills</h4>
                            <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: formatSkills(skillVector) }} />
                            <button onClick={generateFeedback}>Generate Feedback</button>
                        </div>
                    )}
                    {feedback && (
                        <div>
                            <h4>Feedback</h4>
                            <p>{feedback}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConsultantDashboard;