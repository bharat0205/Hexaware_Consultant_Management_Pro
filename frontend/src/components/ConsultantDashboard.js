import React, { useEffect, useState } from 'react';
import StatusCard from './StatusCard';

const ConsultantDashboard = () => {
    const [consultants, setConsultants] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [skillVector, setSkillVector] = useState('');
    const [feedback, setFeedback] = useState('');
    const formatSkills = (skills) => {
    if (!skills) return "";
    return skills
        .replace(/technical_skills:/i, "\n\n<b>Technical_skills:</b>")
        .replace(/soft_skills:/i, "\n\n<b>Soft_skills:</b>")
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
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
            <h2>Consultant Dashboard</h2>
            <select value={selectedId} onChange={handleSelect}>
                <option value="">Select Consultant</option>
                {consultants.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>

            {selectedConsultant && (
                <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px' }}>
                        <StatusCard title="Resume Status" value={selectedConsultant.resume_status} color="blue" />
                        <StatusCard title="Attendance" value={selectedConsultant.attendance} color="green" />
                        <StatusCard title="Opportunities" value={selectedConsultant.opportunities} color="orange" />
                        <StatusCard title="Training" value={selectedConsultant.training} color="purple" />
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                        <button onClick={() => updateConsultant('resume_status', 'Updated')}>Mark Resume as Updated</button>
                        <button onClick={() => updateConsultant('attendance', 'Completed')}>Mark Attendance as Completed</button>
                        <button onClick={() => updateConsultant('opportunities', selectedConsultant.opportunities + 1)}>Add Opportunity</button>
                        <button onClick={() => updateConsultant('training', 'Completed')}>Mark Training as Completed</button>
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <h3>Workflow Progress</h3>
                        <div style={{ 
                            backgroundColor: '#ddd', 
                            borderRadius: '20px', 
                            height: '25px', 
                            width: '80%', 
                            margin: 'auto',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${calculateProgress(selectedConsultant)}%`,
                                backgroundColor: '#4caf50',
                                transition: 'width 0.5s',
                                textAlign: 'center',
                                color: 'white',
                                lineHeight: '25px',
                                fontWeight: 'bold'
                            }}>
                                {calculateProgress(selectedConsultant)}%
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px' }}>
                        <h3>Upload Resume (PDF)</h3>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setResumeFile(e.target.files[0])}
                        />
                        <br />
                        <button
                            onClick={handleResumeFileSubmit}
                            style={{ marginTop: '10px', padding: '10px 15px' }}
                        >
                            Submit Resume for Analysis
                        </button>
                        <div style={{ marginTop: '10px', fontWeight: 'bold', color: uploadMessage.includes("❌") ? 'red' : 'green' }}>
                            {uploadMessage}
                        </div>

                        {skillVector && (
                            <div style={{ marginTop: '20px', textAlign: 'left', display: 'inline-block', maxWidth: '600px' }}>
                                <h4>Extracted Skills:</h4>
                                <div style={{ 
                                    backgroundColor: '#e6f7ff', 
                                    padding: '15px', 
                                    borderRadius: '8px', 
                                    whiteSpace: 'pre-wrap', 
                                    fontFamily: 'monospace',
                                    textAlign: 'left',
                                    color: 'black'
                                }}>
                                    <span dangerouslySetInnerHTML={{ __html: formatSkills(skillVector) }}></span>
                                </div>
                                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                    <button
                                        onClick={generateFeedback}
                                        style={{ padding: '10px 20px' }}
                                    >
                                        Generate Personalized Feedback
                                    </button>
                                </div>
                            </div>
                        )}

                        {feedback && (
                            <div style={{
                                backgroundColor: '#f0f0f0',
                                padding: '15px',
                                borderRadius: '8px',
                                marginTop: '20px',
                                textAlign: 'left',
                                maxWidth: '600px',
                                display: 'inline-block'
                            }}>
                                <strong>Personalized Feedback:</strong>
                                <p>{feedback}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantDashboard;