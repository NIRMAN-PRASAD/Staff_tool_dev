// frontend/src/pages/CandidatePipelinePage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import ResumeUpload from '../components/ResumeUpload';

// --- Reusable Components ---
const StatCard = ({ count, label }) => (
    <div style={styles.statCard}>
        <span style={styles.statCount}>{count}</span>
        <span style={styles.statLabel}>{label}</span>
    </div>
);

const InsightsModal = ({ applicationId, onClose }) => {
    const [insights, setInsights] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!applicationId) return;
        const fetchInsights = async () => {
            setIsLoading(true);
            try {
                const response = await axiosInstance.get(`/candidates/application/${applicationId}/insights`);
                setInsights(response.data);
            } catch (err) {
                setError('Failed to load AI insights.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInsights();
    }, [applicationId]);

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h3>AI Candidate Insights</h3>
                    <button onClick={onClose} style={styles.closeButton}>×</button>
                </div>
                {isLoading && <p>Generating insights...</p>}
                {error && <p style={styles.errorText}>{error}</p>}
                {insights && (
                    <div style={styles.modalBody}>
                        <h4>Summary</h4>
                        <p>{insights.summary}</p>
                        <h4>Strengths</h4>
                        <ul>{insights.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        <h4>Weaknesses / Areas to Probe</h4>
                        <ul>{insights.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                        <h4>Suggested Interview Questions</h4>
                        <ul>{insights.interview_questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
                    </div>
                )}
            </div>
        </div>
    );
};

const BulkResultsReport = ({ results, onClear }) => (
    <div style={{...styles.card, marginTop: '20px', borderColor: '#007bff'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Bulk Upload Report</h3>
            <button onClick={onClear} style={{background: '#6c757d', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px'}}>Clear</button>
        </div>
        
        {results.successful_uploads.length > 0 && (
            <div>
                <h4 style={{color: '#28a745'}}>Successful ({results.successful_uploads.length})</h4>
                <ul>
                    {results.successful_uploads.map(app => (
                        <li key={app.ApplicationID}>{app.candidate.FullName} ({app.candidate.Email})</li>
                    ))}
                </ul>
            </div>
        )}

        {results.failed_uploads.length > 0 && (
            <div>
                <h4 style={{color: '#dc3545'}}>Failed ({results.failed_uploads.length})</h4>
                <ul>
                    {results.failed_uploads.map((fail, i) => (
                        <li key={i}><strong>{fail.filename}:</strong> {fail.error}</li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);

// --- Main Page Component ---
function CandidatePipelinePage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    
    // Data State
    const [jobData, setJobData] = useState(null);
    const [applications, setApplications] = useState([]);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('screening');
    const [viewingInsightsFor, setViewingInsightsFor] = useState(null);

    // Single Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({ message: '', isError: false });

    // Bulk Upload State
    const [bulkFile, setBulkFile] = useState(null);
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [bulkUploadResults, setBulkUploadResults] = useState(null);

    const fetchData = useCallback(async () => {
        if (!jobId) return;
        try {
            const [jobRes, appsRes] = await Promise.all([
                axiosInstance.get(`/jobs/${jobId}`),
                axiosInstance.get(`/jobs/${jobId}/applications`)
            ]);
            setJobData(jobRes.data);
            setApplications(appsRes.data);
        } catch (err) {
            setError("Failed to fetch job data.");
        } finally {
            setIsLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSingleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        setUploadStatus({ message: '', isError: false });

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await axiosInstance.post(`/candidates/apply/${jobId}`, formData);
            setUploadStatus({ message: `Successfully processed ${selectedFile.name}!`, isError: false });
            fetchData(); 
            setSelectedFile(null);
        } catch (err) {
            setUploadStatus({ message: err.response?.data?.detail || "Upload failed.", isError: true });
        } finally {
            setIsUploading(false);
        }
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) return;
        setIsBulkUploading(true);
        setBulkUploadResults(null);

        const formData = new FormData();
        formData.append('file', bulkFile);
        
        try {
            const response = await axiosInstance.post(`/candidates/bulk-apply/${jobId}`, formData);
            setBulkUploadResults(response.data);
            fetchData();
            setBulkFile(null);
        } catch (err) {
            const errorResult = {
                successful_uploads: [],
                failed_uploads: [{ filename: bulkFile.name, error: err.response?.data?.detail || "A critical server error occurred." }]
            };
            setBulkUploadResults(errorResult);
        } finally {
            setIsBulkUploading(false);
        }
    };
    
    if (isLoading) return <div style={styles.container}><p>Loading...</p></div>;
    if (error) return <div style={styles.container}><p style={styles.errorText}>{error}</p></div>;
    if (!jobData) return null;

    return (
        <div style={styles.container}>
            {viewingInsightsFor && <InsightsModal applicationId={viewingInsightsFor} onClose={() => setViewingInsightsFor(null)} />}
            
            <nav style={styles.headerNav}>
                <Link to="/dashboard" style={styles.backLink}>&larr; Back to Jobs</Link>
                <div>
                    <button style={styles.actionButton}>Search Candidates</button>
                    <button onClick={() => navigate(`/jobs/${jobId}/candidates`)} style={{...styles.actionButton, ...styles.viewAllButton}}>View All Candidate</button>
                </div>
            </nav>
            <div style={styles.titleSection}>
                <h1>{jobData.JobTitle}</h1>
                <p style={styles.subTitle}>{jobData.portfolio.PortfolioName} &bull; {jobData.department.DepartmentName}</p>
            </div>
            <div style={styles.statsContainer}>
                <StatCard count={jobData.pipeline_stats.total_applications} label="Total Applications" />
                <StatCard count={jobData.pipeline_stats.shortlisted} label="Shortlisted" />
                <StatCard count={jobData.pipeline_stats.pending_review} label="Pending Review" />
                <StatCard count={jobData.pipeline_stats.rejected} label="Rejected" />
            </div>
            <div style={styles.tabContainer}>
                <button style={activeTab === 'overview' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('overview')}>Overview</button>
                <button style={activeTab === 'screening' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('screening')}>Resume Upload & Screening</button>
            </div>
            
            <div style={styles.tabContent}>
                {activeTab === 'overview' && (
                    <div style={styles.overviewGrid}>
                        <div style={styles.leftColumn}>
                            <div style={styles.card}>
                                <h3>Job Details</h3>
                                <div style={styles.detailItem}><span>Department:</span> <span>{jobData.department.DepartmentName}</span></div>
                                <div style={styles.detailItem}><span>Portfolio:</span> <span>{jobData.portfolio.PortfolioName}</span></div>
                                <div style={styles.detailItem}><span>Location:</span> <span>{jobData.Location || 'N/A'}</span></div>
                                <div style={styles.detailItem}><span>Type:</span> <span>{jobData.JobType}</span></div>
                                <h4 style={styles.skillsHeader}>Required Skills</h4>
                                <div style={styles.skillsContainer}>
                                    {jobData.required_skills.map(skill => (
                                        <span key={skill.SkillID} style={styles.skillTag}>{skill.SkillName}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={{...styles.card, marginTop: '20px'}}>
                                <h3>Job Description</h3>
                                <div style={styles.jobDescription}>{jobData.Description}</div>
                            </div>
                        </div>
                        <div style={styles.rightColumn}>
                            <div style={styles.card}>
                                <h3>Interview Rounds</h3>
                                {jobData.interview_stages.map(stage => (
                                    <div key={stage.StageID} style={styles.interviewRound}>
                                        <div style={styles.roundNumber}>{stage.Sequence}</div>
                                        <div>
                                            <div style={styles.roundTitle}>{stage.StageName}</div>
                                            <div style={styles.roundInterviewer}>{stage.InterviewerInfo}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'screening' && (
                    <>
                        {isBulkUploading && <div style={{...styles.card, textAlign: 'center', marginBottom: '20px'}}>Processing zip file, this may take a moment...</div>}
                        {bulkUploadResults && <BulkResultsReport results={bulkUploadResults} onClear={() => setBulkUploadResults(null)} />}
                        
                        <div style={styles.card}>
                            <h3>Upload Resumes</h3>
                            <div style={styles.uploadContainer}>
                                <div style={{flex: 1}}>
                                    <h4>Individual Upload</h4>
                                    <ResumeUpload onFileSelect={setSelectedFile} />
                                    {selectedFile && (
                                        <div style={styles.filePreview}>
                                            <span>Selected: <strong>{selectedFile.name}</strong></span>
                                            <button onClick={handleSingleUpload} disabled={isUploading} style={styles.uploadButton}>
                                                {isUploading ? 'Processing...' : 'Process Resume'}
                                            </button>
                                        </div>
                                    )}
                                    {uploadStatus.message && <p style={uploadStatus.isError ? styles.errorText : styles.successText}>{uploadStatus.message}</p>}
                                </div>
                                <div style={{flex: 1}}>
                                    <h4>Bulk Upload (.zip)</h4>
                                    <ResumeUpload onFileSelect={setBulkFile} />
                                    {bulkFile && (
                                        <div style={styles.filePreview}>
                                            <span>Selected: <strong>{bulkFile.name}</strong></span>
                                            <button onClick={handleBulkUpload} disabled={isBulkUploading} style={styles.uploadButton}>
                                                {isBulkUploading ? 'Processing...' : 'Process Zip File'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{...styles.card, marginTop: '30px'}}>
                            <h3>Screening Results</h3>
                            <table style={styles.table}>
                                <thead><tr>
                                    <th style={styles.th}>Candidate</th>
                                    <th style={styles.th}>Match %</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Applied Date</th>
                                    <th style={styles.th}>Actions</th>
                                </tr></thead>
                                <tbody>
                                    {applications.map(app => (
                                        <tr key={app.ApplicationID}>
                                            <td style={styles.td}>
                                                <div style={{fontWeight: 'bold'}}>{app.candidate.FullName}</div>
                                                <div style={styles.email}>{app.candidate.Email}</div>
                                            </td>
                                            <td style={styles.td}>{app.MatchScore || 0}%</td>
                                            <td style={styles.td}><span style={styles.stageTag}>{app.Stage}</span></td>
                                            <td style={styles.td}>{new Date(app.AppliedAt).toLocaleDateString()}</td>
                                            <td style={styles.td}>
                                                <div style={styles.actionsContainer}>
                                                    <button onClick={() => setViewingInsightsFor(app.ApplicationID)} title="View AI Insights" style={styles.iconButton}>👁️</button>
                                                    <button title="Assign Interview (Coming Soon)" disabled style={styles.iconButton}>👤</button>
                                                    <button title="Download Resume (Coming Soon)" disabled style={styles.iconButton}>📥</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { maxWidth: '1200px', margin: '20px auto', padding: '0 30px', fontFamily: 'Arial, sans-serif' },
    headerNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    backLink: { textDecoration: 'none', color: '#555', fontWeight: 'bold' },
    actionButton: { padding: '10px 20px', border: '1px solid #ccc', borderRadius: '5px', background: 'white', cursor: 'pointer', marginLeft: '10px' },
    viewAllButton: { background: '#333', color: 'white' },
    titleSection: { textAlign: 'center', marginBottom: '30px' },
    subTitle: { color: '#777', marginTop: '-15px' },
    statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' },
    statCard: { background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    statCount: { fontSize: '2.5rem', fontWeight: 'bold', display: 'block', color: '#333' },
    statLabel: { color: '#888', fontSize: '0.9rem' },
    tabContainer: { borderBottom: '2px solid #eee', marginBottom: '30px' },
    tab: { background: 'none', border: 'none', padding: '15px 25px', cursor: 'pointer', fontSize: '1rem', color: '#888' },
    tabActive: { background: 'none', border: 'none', padding: '15px 25px', cursor: 'pointer', fontSize: '1rem', color: '#333', borderBottom: '3px solid #333', fontWeight: 'bold' },
    tabContent: {},
    overviewGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' },
    leftColumn: {},
    rightColumn: {},
    card: { background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    detailItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
    skillsHeader: { marginTop: '25px', marginBottom: '10px' },
    skillsContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
    skillTag: { background: '#f0f0f0', color: '#555', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85rem' },
    jobDescription: { color: '#666', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
    interviewRound: { display: 'flex', alignItems: 'center', gap: '15px', background: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '10px' },
    roundNumber: { background: '#e0e0e0', color: '#333', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 },
    roundTitle: { fontWeight: 'bold', color: '#444' },
    roundInterviewer: { color: '#777', fontSize: '0.9rem' },
    errorText: { color: '#dc3545', marginTop: '15px', fontWeight: 'bold' },
    successText: { color: '#28a745', marginTop: '15px', fontWeight: 'bold' },
    filePreview: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '15px', backgroundColor: '#eef5ff', borderRadius: '5px' },
    uploadButton: { padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee', color: '#555' },
    td: { padding: '12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' },
    email: { fontSize: '0.85rem', color: '#6c757d', marginTop: '4px' },
    stageTag: { background: '#e9ecef', color: '#495057', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' },
    actionsContainer: { display: 'flex', gap: '8px' },
    iconButton: { background: 'none', border: '1px solid #ccc', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    uploadContainer: { display: 'flex', gap: '20px', marginTop: '10px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' },
    modalBody: { overflowY: 'auto' },
    closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
};

export default CandidatePipelinePage;