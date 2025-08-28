// frontend/src/pages/JobManagementPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

// Import the updated component
import InterviewRoundRow from '../components/InterviewRoundRow.jsx';

function JobManagementPage() {
    const { authToken } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [jobTitle, setJobTitle] = useState('');
    const [portfolioId, setPortfolioId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [jobType, setJobType] = useState('Full Time');
    const [experience, setExperience] = useState('');
    const [requiredSkills, setRequiredSkills] = useState('');
    const [interviewRounds, setInterviewRounds] = useState([{ StageName: '', InterviewerInfo: '', Sequence: 1 }]);
    const [jobDescription, setJobDescription] = useState('');
    
    // UI State
    const [jdInputMode, setJdInputMode] = useState('ai');
    const [portfolios, setPortfolios] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const fileInputRef = useRef(null); // Ref for the hidden file input

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, dRes] = await Promise.all([
                    axiosInstance.get('/portfolios/'),
                    axiosInstance.get('/departments/')
                ]);
                setPortfolios(pRes.data);
                setDepartments(dRes.data);
                if (pRes.data.length > 0) setPortfolioId(pRes.data[0].PortfolioID);
            } catch (err) { setError('Failed to fetch initial data.'); }
        };
        fetchData();
    }, []);

    // Filter departments when portfolio changes
    useEffect(() => {
        if (portfolioId) {
            const relatedDepts = departments.filter(d => d.PortfolioID === parseInt(portfolioId));
            setFilteredDepartments(relatedDepts);
            setDepartmentId(relatedDepts.length > 0 ? relatedDepts[0].DepartmentID : '');
        }
    }, [portfolioId, departments]);

    // Handlers for Interview Rounds
    const handleAddRound = () => setInterviewRounds([...interviewRounds, { StageName: '', InterviewerInfo: '', Sequence: interviewRounds.length + 1 }]);
    const handleRemoveRound = (indexToRemove) => setInterviewRounds(interviewRounds.filter((_, index) => index !== indexToRemove));
    const handleRoundChange = (index, field, value) => setInterviewRounds(interviewRounds.map((round, i) => i === index ? { ...round, [field]: value } : round));

    // Handler for parsing uploaded JD
    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axiosInstance.post('/jobs/parse-jd', formData);
            setJobDescription(response.data.description);
            setJdInputMode('manual');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to parse file.');
        } finally {
            setIsLoading(false);
            event.target.value = null;
        }
    };

    // Handler for AI generation
    const handleGenerateJD = async () => {
        if (!jobTitle || !requiredSkills || !experience) {
            setError("Please fill Job Title, Skills, and Experience to generate a JD.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const skillsArray = requiredSkills.split(',').map(s => s.trim());
            const response = await axiosInstance.post('/jobs/generate-jd', { title: jobTitle, skills: skillsArray, experience: experience });
            setJobDescription(response.data.job_description);
            setJdInputMode('manual'); // Switch to manual view to show the result
        } catch (err) {
            setError('Failed to generate JD with AI.');
        } finally { setIsLoading(false); }
    };

    // Handler for form submission
    const handleCreateJob = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        const jobData = {
            JobTitle: jobTitle,
            PortfolioID: parseInt(portfolioId, 10),
            DepartmentID: parseInt(departmentId, 10),
            JobType: jobType,
            ExperienceRequired: experience,
            required_skills: requiredSkills.split(',').map(s => s.trim()),
            interview_stages: interviewRounds.map((r, i) => ({ ...r, Sequence: i + 1 })),
            Description: jobDescription,
        };
        try {
            const response = await axiosInstance.post('/jobs/', jobData);
            setSuccess(`Job "${response.data.JobTitle}" created successfully!`);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create job.');
            setIsLoading(false);
        }
    };

    // Reusable button component for JD modes
    const JdModeButton = ({ mode, label }) => (
        <button
            type="button"
            onClick={() => {
                if (mode === 'upload') {
                    fileInputRef.current.click();
                } else {
                    setJdInputMode(mode);
                }
            }}
            style={jdInputMode === mode ? styles.jdButtonActive : styles.jdButton}
        >
            {label}
        </button>
    );

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <h2>Create New Job</h2>
                    <button onClick={() => navigate('/dashboard')} style={styles.closeButton}>×</button>
                </div>
                <form onSubmit={handleCreateJob} style={styles.form}>
                    <div style={styles.grid}>
                        <InputField label="Job Name*" value={jobTitle} onChange={setJobTitle} required />
                        <SelectField label="Portfolio*" value={portfolioId} onChange={setPortfolioId} options={portfolios.map(p => ({ value: p.PortfolioID, label: p.PortfolioName }))} />
                        <SelectField label="Department*" value={departmentId} onChange={setDepartmentId} options={filteredDepartments.map(d => ({ value: d.DepartmentID, label: d.DepartmentName }))} />
                        <InputField label="Experience Required*" value={experience} onChange={setExperience} placeholder="e.g., 2-5" required/>
                        <SelectField label="Type*" value={jobType} onChange={setJobType} options={[{ value: 'Full Time', label: 'Full Time' }, { value: 'Contract', label: 'Contract' }, { value: 'Intern', label: 'Intern' }]} />
                    </div>
                    
                    <div style={{gridColumn: 'span 2', marginBottom: '30px'}}>
                        <label style={styles.label}>Required Skills*</label>
                        <input style={styles.input} type="text" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} placeholder="Enter comma-separated skills (e.g., Python, SQL, React)" required />
                    </div>
                    
                    <div style={styles.subHeader}>
                        <h3>Interview Rounds</h3>
                        <button type="button" onClick={handleAddRound} style={styles.addButton}>+ Add Round</button>
                    </div>
                    {interviewRounds.map((round, index) => (
                        <InterviewRoundRow key={index} index={index} round={round} onRoundChange={handleRoundChange} onRemoveRound={handleRemoveRound} />
                    ))}

                    <h3 style={{...styles.subHeader, marginTop: '30px'}}>Job Description</h3>
                    <div style={styles.jdModeContainer}>
                        <JdModeButton mode="manual" label="Write manually" />
                        <JdModeButton mode="upload" label="Upload File" />
                        <JdModeButton mode="ai" label="Generate with AI" />
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept=".pdf,.docx" />
                    </div>
                    
                    {jdInputMode === 'ai' && (
                         <div style={styles.aiHelperBox}>
                            <span>Enter Job Title, Experience, and Skills above, then click Generate.</span>
                            <button type="button" onClick={handleGenerateJD} disabled={isLoading} style={styles.generateButton}>
                                ✨ Generate JD
                            </button>
                        </div>
                    )}
                    
                    <textarea rows="8" value={jobDescription} placeholder="Enter Job Description..." onChange={(e) => setJobDescription(e.target.value)} style={styles.textarea} required/>

                    {error && <p style={styles.error}>{error}</p>}
                    {success && <p style={styles.success}>{success}</p>}

                    <div style={styles.formActions}>
                        <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelButton}>Cancel</button>
                        <button type="submit" disabled={isLoading} style={styles.createButton}>{isLoading ? 'Creating...' : 'Create Job'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- CORRECTED INPUTFIELD COMPONENT ---
const InputField = ({ label, value, onChange, ...props }) => (
    <div>
        <label style={styles.label}>{label}</label>
        {/* The fix is here: we pass e.target.value to the onChange function */}
        <input style={styles.input} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </div>
);
const SelectField = ({ label, value, onChange, options, ...props }) => (
    <div>
        <label style={styles.label}>{label}</label>
        <select style={{...styles.input, ...styles.select}} value={value} onChange={(e) => onChange(e.target.value)} {...props}>
             <option value="" disabled>Select...</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, fontFamily: 'sans-serif' },
    modalContent: { backgroundColor: 'white', padding: '0', borderRadius: '8px', width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
    modalHeader: { padding: '20px 30px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    form: { padding: '30px', overflowY: 'auto', flex: 1 },
    closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px', marginBottom: '20px' },
    label: { display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#333' },
    input: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
    select: { appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '16px 12px', paddingRight: '2.5rem' },
    textarea: { width: '100%', padding: '12px', boxSizing: 'border-box', marginTop: '15px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical', fontSize: '14px' },
    subHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    addButton: { fontSize: '13px', padding: '6px 14px', cursor: 'pointer', backgroundColor: '#f0f0f0', color: '#333', border: '1px solid #ccc', borderRadius: '4px' },
    jdModeContainer: { display: 'flex', gap: '10px', marginBottom: '10px' },
    jdButton: { padding: '8px 15px', border: '1px solid #ccc', background: '#6f42c1', cursor: 'pointer', borderRadius: '4px' },
    jdButtonActive: { padding: '8px 15px', border: '1px solid #007bff', background: '#e7f3ff', color: '#007bff', cursor: 'pointer', borderRadius: '4px' },
    aiHelperBox: { backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '5px', border: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' },
    generateButton: { padding: '10px 20px', cursor: 'pointer', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px', padding: '0 30px 20px 30px', backgroundColor: '#fff' },
    cancelButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    createButton: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    error: { color: '#721c24', textAlign: 'center', marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px', border: '1px solid #f5c6cb' },
    success: { color: '#155724', textAlign: 'center', marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px', border: '1px solid #c3e6cb' },
};

export default JobManagementPage;