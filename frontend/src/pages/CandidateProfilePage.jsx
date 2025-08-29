// frontend/src/pages/CandidateProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

// Define the API URL once at the top for easy access
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Reusable card component for styling consistency
const Card = ({ children, style }) => <div style={{...styles.card, ...style}}>{children}</div>;

function CandidateProfilePage() {
    const { applicationId } = useParams();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!applicationId) return;
            try {
                const response = await axiosInstance.get(`/candidates/application/${applicationId}/profile`);
                setProfile(response.data);
            } catch (err) {
                setError('Failed to load candidate profile.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [applicationId]);

    if (isLoading) return <div style={styles.container}><p>Loading profile...</p></div>;
    if (error) return <div style={styles.container}><p style={{color: 'red'}}>{error}</p></div>;
    if (!profile) return null;

    const { candidate, application, job, matched_skills } = profile;

    // Construct the secure download URL
    const authToken = localStorage.getItem('authToken');
    const downloadUrl = `${API_URL}/candidates/${candidate.CandidateID}/download-resume?token=${authToken}`;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <Link to={`/jobs/${job.JobID}/candidates`} style={styles.backLink}>&larr; Back to Candidate List</Link>
                <div style={styles.headerActions}>
                    <button style={styles.actionButton}>Send Email</button>
                    <button style={{...styles.actionButton, ...styles.primaryAction}}>Move to Interview</button>
                </div>
            </header>
            <div style={styles.title}>
                <h1>{candidate.FullName}</h1>
                <p>Candidate Profile</p>
            </div>

            <main style={styles.mainGrid}>
                {/* Left Column */}
                <div style={styles.leftColumn}>
                    <Card>
                        <h3>Contact Information</h3>
                        <p><strong>Email:</strong> {candidate.Email}</p>
                        <p><strong>Phone:</strong> {candidate.Phone || 'N/A'}</p>
                    </Card>
                    <Card>
                        <h3>Job Matching</h3>
                        <div style={styles.matchScore}>{application.MatchScore}%</div>
                        <p style={styles.matchText}>Matched with {job.JobTitle}</p>
                    </Card>
                    <Card>
                        <h3>Quick Stats</h3>
                        <p><strong>Experience:</strong> {candidate.ExperienceYears || 'N/A'} years</p>
                        <p><strong>Status:</strong> <span style={styles.statusTag}>{application.Stage}</span></p>
                    </Card>
                </div>

                {/* Right Column */}
                <div style={styles.rightColumn}>
                    <Card>
                        <h3>Professional Summary</h3>
                        <p style={styles.summaryText}>{candidate.ResumeSummary}</p>
                    </Card>
                    <Card>
                        <h3>Skills Assessment</h3>
                        <p style={styles.skillsSub}>Matched Skills:</p>
                        <div style={styles.skillsContainer}>
                            {matched_skills.map(skill => (
                                <span key={skill.SkillID} style={styles.skillTag}>{skill.SkillName}</span>
                            ))}
                        </div>
                    </Card>
                    <Card>
                        <h3>Full AI Analysis</h3>
                        <p style={styles.summaryText}>{candidate.TechnicalSkillsSummary}</p>
                    </Card>
                </div>
            </main>

            <footer style={styles.footerActions}>
                <button disabled style={styles.actionButton}>Assign Interviewer</button>
                <button disabled style={styles.actionButton}>Move to Next Round</button>
                <button disabled style={styles.actionButton}>Reject &rarr; Talent Pool</button>
                
                {/* --- THIS IS THE UPDATED DOWNLOAD LINK --- */}
                <a 
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }} // Prevents underline on the link
                >
                    <button style={styles.actionButton}>Download Resume</button>
                </a>
            </footer>
        </div>
    );
}

const styles = {
    container: { maxWidth: '1100px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    backLink: { textDecoration: 'none', color: '#555' },
    headerActions: { display: 'flex', gap: '10px' },
    actionButton: { padding: '8px 16px', border: '1px solid #ccc', borderRadius: '5px', background: '#f0f0f0', cursor: 'pointer', fontSize: '14px' },
    primaryAction: { background: '#333', color: 'white', border: 'none' },
    title: { textAlign: 'center', marginBottom: '30px', 'p': { color: '#888', marginTop: '-15px' } },
    mainGrid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' },
    leftColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
    rightColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    matchScore: { fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', color: '#007bff' },
    matchText: { textAlign: 'center', color: '#777', fontSize: '0.9rem' },
    statusTag: { background: '#e9ecef', color: '#495057', padding: '4px 10px', borderRadius: '12px' },
    summaryText: { lineHeight: '1.6', color: '#666' },
    skillsSub: { color: '#888', fontSize: '0.9rem', marginBottom: '10px' },
    skillsContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    skillTag: { background: '#007bff', color: 'white', padding: '5px 12px', borderRadius: '15px' },
    footerActions: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }
};

export default CandidateProfilePage;