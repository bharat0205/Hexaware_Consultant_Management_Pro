import React, { useEffect, useState } from 'react';
import StatusCard from './StatusCard'; // Assuming you have this component

const ConsultantDashboard = () => {
    const [consultants, setConsultants] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [feedback, setFeedback] = useState('');

    // State for the new local AI agent
    const [keywords, setKeywords] = useState('Python, React, Flask, SQL, Leadership'); // Example keywords
    const [analysisResult, setAnalysisResult] = useState(null);

    // REMOVED: All theme-related code (useTheme, darkMode) is gone.

    const calculateProgress = (consultant) => {
        if (!consultant) return 0;
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
        // Reset analysis when changing consultant
        setAnalysisResult(null);
        setUploadMessage('');
        setFeedback('');
    };

    const updateConsultant = (field, value) => {
        fetch(`http://localhost:5000/consultants/${selectedConsultant.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
        })
        .then(res => res.json())
        .then(data => {
            // This part updates the UI immediately after a successful action
            setSelectedConsultant(data);
            const updatedList = consultants.map(c =>
                c.id === data.id ? data : c
            );
            setConsultants(updatedList);
        });
    };

    // This is the correct function to work with our local AI backend
    const handleResumeFileSubmit = () => {
        if (!resumeFile) {
            setUploadMessage("❌ Please select a file first.");
            return;
        }
        if (!keywords.trim()) {
            setUploadMessage("❌ Please enter some keywords to check for.");
            return;
        }

        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('keywords', keywords); // Add keywords to the request

        setUploadMessage("✅ Analyzing resume...");
        setAnalysisResult(null);
        setFeedback('');

        fetch('http://localhost:5000/upload_resume', { // Correct endpoint
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                setUploadMessage(`❌ Error: ${data.error}`);
            } else {
                setAnalysisResult(data); // Store the entire result object
                setUploadMessage("✅ Analysis complete.");
            }
        })
        .catch(err => {
            setUploadMessage(`❌ Error: ${err.message}`);
        });
    };

    const generateFeedback = () => {
        if (!analysisResult || !analysisResult.found_keywords) {
            setFeedback('Cannot generate feedback without an analysis result.');
            return;
        }

        fetch('http://localhost:5000/generate_feedback', { // Correct endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ found_keywords: analysisResult.found_keywords })
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
        // Hardcoded to a light/black theme to match the rest of the app
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

                    <div style={{ marginTop: '40px' }}>
                        <h3>Upload & Analyze Resume</h3>
                        <div>
                            <label htmlFor="keywords">Keywords to look for (comma-separated):</label>
                            <br />
                            <input
                                id="keywords"
                                type="text"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                style={{ width: '50%', padding: '8px', marginTop: '5px', marginBottom: '15px' }}
                            />
                        </div>

                        <input type="file" accept=".pdf, .docx" onChange={(e) => setResumeFile(e.target.files[0])} />
                        <br />
                        <button onClick={handleResumeFileSubmit} style={{ marginTop: '10px', padding: '10px 15px' }}>
                            Submit Resume for Analysis
                        </button>
                        <div style={{ marginTop: '10px', fontWeight: 'bold', color: uploadMessage.includes("❌") ? 'red' : 'green' }}>
                            {uploadMessage}
                        </div>

                        {analysisResult && (
                            <div style={{ marginTop: '20px', textAlign: 'left', display: 'inline-block', maxWidth: '600px', backgroundColor: '#e6f7ff', padding: '15px', borderRadius: '8px', color: 'black' }}>
                                <h4>Analysis Result:</h4>
                                <p><strong>Match Score:</strong> {analysisResult.match_score_percent}%</p>
                                <p><strong>Found Keywords:</strong> {analysisResult.found_keywords.length > 0 ? analysisResult.found_keywords.join(', ') : 'None'}</p>
                                
                                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                    <button onClick={generateFeedback} style={{ padding: '10px 20px' }}>
                                        Generate Personalized Feedback
                                    </button>
                                </div>
                            </div>
                        )}

                        {feedback && (
                            <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px', marginTop: '20px', textAlign: 'left', maxWidth: '600px', display: 'inline-block', color: 'black' }}>
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
