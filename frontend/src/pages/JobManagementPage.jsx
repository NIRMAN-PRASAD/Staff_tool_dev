import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Helper components import
import SkillInput from '../components/SkillInput.jsx';
import InterviewRoundRow from '../components/InterviewRoundRow.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function JobManagementPage() {
    const { authToken } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [jobTitle, setJobTitle] = useState('');
    const [portfolioId, setPortfolioId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [jobType, setJobType] = useState('Full Time');
    const [experience, setExperience] = useState('');
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [interviewRounds, setInterviewRounds] = useState([{ StageName: '', InterviewerInfo: '', Sequence: 1 }]);
    const [jobDescription, setJobDescription] = useState('');
    
    // Data & UI State
    const [portfolios, setPortfolios] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch initial data for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, dRes] = await Promise.all([
                    axios.get(`${API_URL}/portfolios/`, { headers: { Authorization: `Bearer ${authToken}` } }),
                    axios.get(`${API_URL}/departments/`, { headers: { Authorization: `Bearer ${authToken}` } })
                ]);
                setPortfolios(pRes.data);
                setDepartments(dRes.data);
                if (pRes.data.length > 0) setPortfolioId(pRes.data[0].PortfolioID);
                if (dRes.data.length > 0) setDepartmentId(dRes.data[0].DepartmentID);
            } catch (err) {
                setError('Failed to fetch initial data.');
            }
        };
        fetchData();
    }, [authToken]);

    const handleAddRound = () => {
        setInterviewRounds([...interviewRounds, { StageName: '', InterviewerInfo: '', Sequence: interviewRounds.length + 1 }]);
    };
    
    const handleRemoveRound = (indexToRemove) => {
        setInterviewRounds(interviewRounds.filter((_, index) => index !== indexToRemove));
    };
    
    const handleRoundChange = (index, field, value) => {
        const updatedRounds = interviewRounds.map((round, i) => i === index ? { ...round, [field]: value } : round);
        setInterviewRounds(updatedRounds);
    };

    const handleGenerateJD = async () => {
        if (!jobTitle || requiredSkills.length === 0 || !experience) {
            setError("Please fill Job Title, Skills, and Experience to generate a JD.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/jobs/generate-jd`, 
                { title: jobTitle, skills: requiredSkills, experience: experience },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            setJobDescription(response.data.job_description);
        } catch (err) {
            setError('Failed to generate JD with AI.');
        } finally {
            setIsLoading(false);
        }
    };

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
            required_skills: requiredSkills, // Backend ab names accept karega
            interview_stages: interviewRounds.map((r, i) => ({ ...r, Sequence: i + 1 })),
            Description: jobDescription,
        };
        
        try {
            await axios.post(`${API_URL}/jobs/`, jobData, { headers: { Authorization: `Bearer ${authToken}` } });
            setSuccess(`Job "${jobTitle}" created successfully!`);
            // Optionally reset form here
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create job.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <button onClick={() => navigate('/dashboard')} style={styles.closeButton}>×</button>
                <h2>Create New Job</h2>
                <form onSubmit={handleCreateJob}>
                    <div style={styles.grid}>
                        <InputField label="Job Name*" value={jobTitle} onChange={setJobTitle} required />
                        <SelectField label="Portfolio*" value={portfolioId} onChange={setPortfolioId} options={portfolios.map(p => ({ value: p.PortfolioID, label: p.PortfolioName }))} />
                        <SelectField label="Department*" value={departmentId} onChange={setDepartmentId} options={departments.map(d => ({ value: d.DepartmentID, label: d.DepartmentName }))} />
                        <SelectField label="Type*" value={jobType} onChange={setJobType} options={[{ value: 'Full Time', label: 'Full Time' }, { value: 'Contract', label: 'Contract' }, { value: 'Intern', label: 'Intern' }]} />
                        <div style={{gridColumn: 'span 2'}}>
                            <InputField label="Years of Experience*" value={experience} onChange={setExperience} placeholder="e.g., 2-4 years" required/>
                        </div>
                        <div style={{gridColumn: 'span 2'}}>
                            <label>Required Skills*</label>
                            <SkillInput selectedSkills={requiredSkills} onSkillsChange={setRequiredSkills} authToken={authToken} />
                        </div>
                    </div>
                    
                    <h3 style={styles.subHeader}>Interview Rounds <button type="button" onClick={handleAddRound} style={styles.addButton}>+ Add Round</button></h3>
                    {interviewRounds.map((round, index) => (
                        <InterviewRoundRow key={index} index={index} round={round} onRoundChange={handleRoundChange} onRemoveRound={handleRemoveRound} />
                    ))}

                    <h3 style={styles.subHeader}>Job Description</h3>
                    <div style={styles.jdButtons}>
                        <button type="button" onClick={handleGenerateJD} disabled={isLoading} style={styles.generateButton}>{isLoading ? 'Generating...' : '✨ Generate with AI'}</button>
                    </div>
                    <textarea rows="12" value={jobDescription} placeholder="Job description will appear here..." onChange={(e) => setJobDescription(e.target.value)} style={styles.textarea} required/>

                    <div style={styles.formActions}>
                        <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelButton}>Cancel</button>
                        <button type="submit" disabled={isLoading} style={styles.createButton}>{isLoading ? 'Creating...' : 'Create Job'}</button>
                    </div>

                    {error && <p style={styles.error}>{error}</p>}
                    {success && <p style={styles.success}>{success}</p>}
                </form>
            </div>
        </div>
    );
}

const InputField = ({ label, value, onChange, ...props }) => (
    <div>
        {label && <label style={styles.label}>{label}</label>}
        <input style={styles.input} type="text" value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </div>
);

const SelectField = ({ label, value, onChange, options }) => (
    <div>
        <label style={styles.label}>{label}</label>
        <select style={styles.input} value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    modalContent: { fontFamily: 'Arial, sans-serif', backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
    closeButton: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    label: { display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' },
    input: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' },
    textarea: { width: '100%', padding: '10px', boxSizing: 'border-box', marginTop: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' },
    subHeader: { marginTop: '30px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' },
    addButton: { fontSize: '12px', padding: '5px 10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' },
    jdButtons: { display: 'flex', gap: '10px', marginBottom: '10px' },
    generateButton: { padding: '10px 15px', cursor: 'pointer', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' },
    cancelButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    createButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red', textAlign: 'center', marginTop: '15px' },
    success: { color: 'green', textAlign: 'center', marginTop: '15px' },
};

export default JobManagementPage;