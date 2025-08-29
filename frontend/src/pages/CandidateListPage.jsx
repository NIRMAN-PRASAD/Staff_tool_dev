// frontend/src/pages/CandidateListPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

// Get the base URL from environment variables for constructing the download link
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function CandidateListPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [jobTitle, setJobTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!jobId) return;
            setIsLoading(true);
            try {
                // Fetch applications (with candidate data) and job title in parallel
                const [appsResponse, jobResponse] = await Promise.all([
                    axiosInstance.get(`/jobs/${jobId}/applications`),
                    axiosInstance.get(`/jobs/${jobId}`)
                ]);
                setApplications(appsResponse.data);
                setJobTitle(jobResponse.data.JobTitle);
            } catch (err) {
                setError('Failed to fetch candidate data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [jobId]);

    if (isLoading) return <div style={styles.container}><p>Loading candidates...</p></div>;
    if (error) return <div style={styles.container}><p style={{color: 'red'}}>{error}</p></div>;

    return (
        <div style={styles.container}>
            <Link to={`/pipeline/${jobId}`} style={styles.backLink}>&larr; Back to Job Overview</Link>
            <h1 style={styles.header}>Candidate List for "{jobTitle}"</h1>
            
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Candidate</th>
                        <th style={styles.th}>Match Score</th>
                        <th style={styles.th}>Current Stage</th>
                        <th style={styles.th}>Applied On</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {applications.length > 0 ? applications.map(app => (
                        <tr key={app.ApplicationID}>
                            <td style={styles.td}>
                                <div style={{fontWeight: 'bold'}}>{app.candidate.FullName}</div>
                                <div style={styles.email}>{app.candidate.Email}</div>
                            </td>
                            <td style={styles.td}>{app.MatchScore ? `${app.MatchScore}%` : 'N/A'}</td>
                            <td style={styles.td}><span style={styles.stageTag}>{app.Stage}</span></td>
                            <td style={styles.td}>{new Date(app.AppliedAt).toLocaleDateString()}</td>
                            <td style={styles.td}>
                                {/* --- THIS IS THE UPDATED ACTIONS COLUMN --- */}
                                <div style={styles.actionsContainer}>
                                    <button 
                                        onClick={() => navigate(`/application/${app.ApplicationID}/profile`)}
                                        title="View Profile" 
                                        style={styles.iconButton}
                                    >
                                        👁️
                                    </button>
                                    <button 
                                        title="Assign Interview (Coming Soon)" 
                                        disabled 
                                        style={styles.iconButton}
                                    >
                                        👤
                                    </button>
                                    <a 
                                        href={`${API_URL}/candidates/${app.candidate.CandidateID}/download-resume?token=${localStorage.getItem('authToken')}`}
                                        title="Download Resume"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <button style={styles.iconButton}>📥</button>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No candidates found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

const styles = {
    container: { maxWidth: '1200px', margin: '20px auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
    backLink: { display: 'inline-block', marginBottom: '20px', textDecoration: 'none', color: '#007bff', fontWeight: 'bold' },
    header: { marginBottom: '30px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: '#f8f9fa', padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' },
    td: { padding: '12px', borderBottom: '1px solid #dee2e6', verticalAlign: 'middle' },
    email: { fontSize: '0.85rem', color: '#6c757d' },
    stageTag: { background: '#e9ecef', color: '#495057', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' },
    // --- UPDATED AND NEW STYLES FOR ACTION ICONS ---
    actionsContainer: { 
        display: 'flex', 
        gap: '8px' 
    },
    iconButton: {
        background: 'none',
        border: '1px solid #ccc',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        fontSize: '16px',
        transition: 'background-color 0.2s',
    },
};

export default CandidateListPage;