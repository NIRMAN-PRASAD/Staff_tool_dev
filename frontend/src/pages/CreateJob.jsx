import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, jobService } from '../services/api';

function CreateJob() {
    const navigate = useNavigate();
    
    // Form state for all fields
    const [jobTitle, setJobTitle] = useState('');
    const [description, setDescription] = useState('');
    const [experience, setExperience] = useState('');
    const [interviewRounds, setInterviewRounds] = useState('');

    // State for AI generation
    const [keySkills, setKeySkills] = useState('');
    
    // UI state
    const [activeTab, setActiveTab] = useState('manual');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });

    useEffect(() => {
        // Security check to ensure only HR/Admin can access
        const token = localStorage.getItem('accessToken');
        if (!token) return navigate('/login');
        const userData = authService.decodeToken(token);
        if (!userData || !['Admin', 'HR'].includes(userData.role)) {
            alert('Access Denied.');
            navigate('/');
        }
    }, [navigate]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setLoading(true);
        setMessage({ text: '', isError: false });
        try {
            const response = await jobService.parseJdFromPdf(file);
            setDescription(response.data.description);
            setMessage({ text: 'JD extracted successfully from PDF!', isError: false });
        } catch (error) {
            setMessage({ text: 'Failed to parse PDF.', isError: true });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateJD = async () => {
        if (!jobTitle || !experience || !keySkills) {
            setMessage({ text: 'Please fill Job Title, Experience, and Key Skills to generate JD.', isError: true });
            return;
        }
        setLoading(true);
        setMessage({ text: '', isError: false });
        try {
            const requestData = {
                job_title: jobTitle,
                experience_years: parseInt(experience),
                key_skills: keySkills.split(',').map(skill => skill.trim())
            };
            const response = await jobService.generateJdWithAi(requestData);
            setDescription(response.data.description);
            setMessage({ text: 'AI has generated the Job Description!', isError: false });
        } catch (error) {
            setMessage({ text: 'AI generation failed. Please try again.', isError: true });
        } finally {
            setLoading(false);
        }
    };
    
    // --- THIS IS THE FINAL API CALL LOGIC ---
    const handleCreateJob = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', isError: false });

        // 1. Backend ke schema se match karne ke liye naya object banayein
        const jobPayload = {
            job_title: jobTitle,
            description: description,
            experience_years: parseInt(experience, 10), // String ko integer mein badlein
            interview_rounds: interviewRounds.split(',').map(round => round.trim()) // Comma-separated string ko array banayein
        };
        
        try {
            // 2. jobService se API call karein
            await jobService.createJob(jobPayload);
            setMessage({ text: 'Job created successfully! Redirecting to home...', isError: false });
            
            // 3. Success ke baad 2 second mein home page par bhej dein
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            setMessage({ text: error.response?.data?.detail || 'Failed to create job.', isError: true });
            setLoading(false);
        }
        // Loading ko 'finally' mein set nahi karenge, kyunki success par redirect ho jaayega
    };
    
    const handleDownloadJD = () => {
        const element = document.createElement("a");
        const file = new Blob([description], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${jobTitle.replace(/ /g, '_') || 'Job'}_JD.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="container">
            <nav>
                <div><Link to="/">Home</Link></div>
                <button onClick={() => { localStorage.removeItem('accessToken'); navigate('/login'); }}>Logout</button>
            </nav>
            <h2>Create a New Job Posting</h2>

            <form onSubmit={handleCreateJob}>
                <div className="form-group">
                    <label>Job Title</label>
                    <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Years of Experience</label>
                    <input type="number" value={experience} onChange={e => setExperience(e.target.value)} required />
                </div>
                
                <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
                    <button type="button" onClick={() => setActiveTab('manual')} style={{ background: activeTab === 'manual' ? '#007BFF' : 'grey', marginRight: '10px' }}>Write / Paste JD</button>
                    <button type="button" onClick={() => setActiveTab('upload')} style={{ background: activeTab === 'upload' ? '#007BFF' : 'grey', marginRight: '10px' }}>Upload JD (PDF)</button>
                    <button type="button" onClick={() => setActiveTab('ai')} style={{ background: activeTab === 'ai' ? '#007BFF' : 'grey' }}>Generate with AI</button>
                </div>

                {activeTab === 'ai' && (
                    <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                        <h4>Generate Job Description with AI</h4>
                        <div className="form-group">
                            <label>Key Skills (comma-separated)</label>
                            <input type="text" value={keySkills} onChange={e => setKeySkills(e.target.value)} placeholder="e.g., Python, FastAPI, React" />
                        </div>
                        <button type="button" onClick={handleGenerateJD} disabled={loading}>
                            {loading ? 'Generating...' : '✨ Generate JD'}
                        </button>
                    </div>
                )}
                
                {activeTab === 'upload' && (
                     <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                        <h4>Upload Job Description from PDF</h4>
                        <div className="form-group">
                            <input type="file" accept=".pdf" onChange={handleFileChange} disabled={loading} />
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label>Job Description (JD)</label>
                    <textarea rows="12" value={description} onChange={e => setDescription(e.target.value)} required ></textarea>
                    {description && <button type="button" onClick={handleDownloadJD} style={{marginTop: '10px', background: '#28a745'}}>Download JD</button>}
                </div>
                
                <div className="form-group">
                    <label>Rounds of Interview (comma-separated)</label>
                    <input type="text" value={interviewRounds} onChange={e => setInterviewRounds(e.target.value)} placeholder="e.g., HR, Technical, Manager" required/>
                </div>

                <hr style={{margin: '20px 0'}} />
                <button type="submit" style={{width: '100%', fontSize: '18px'}} disabled={loading}>
                    {loading ? 'Creating Job...' : 'Create Final Job Posting'}
                </button>
            </form>
            {message.text && <div className={`message ${message.isError ? 'error' : 'success'}`}>{message.text}</div>}
        </div>
    );
}

export default CreateJob;