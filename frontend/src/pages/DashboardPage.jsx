import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function DashboardPage() {
    const { user, authToken, logout } = useAuth();
    const navigate = useNavigate();

    // State for data
    const [allJobs, setAllJobs] = useState([]);
    const [portfolios, setPortfolios] = useState([]);
    
    // State for UI and filtering
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetches both jobs and portfolios from the backend
    const fetchData = useCallback(async () => {
        if (!authToken) return;
        setIsLoading(true);
        setError('');
        try {
            const [jobsResponse, portfoliosResponse] = await Promise.all([
                axios.get(`${API_URL}/jobs/`, { headers: { Authorization: `Bearer ${authToken}` } }),
                axios.get(`${API_URL}/portfolios/`, { headers: { Authorization: `Bearer ${authToken}` } }),
            ]);
            setAllJobs(jobsResponse.data);
            setFilteredJobs(jobsResponse.data); // Initially, show all jobs
            setPortfolios(portfoliosResponse.data);
        } catch (err) {
            setError('Failed to fetch data. Your session might be expired.');
            console.error("Fetch data error:", err.response ? err.response.data : err);
        } finally {
            setIsLoading(false);
        }
    }, [authToken]);

    // Fetch data when the component mounts
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter jobs whenever the selected portfolio changes
    useEffect(() => {
        if (selectedPortfolioId === 'all') {
            setFilteredJobs(allJobs);
        } else {
            const portfolioId = parseInt(selectedPortfolioId, 10);
            const filtered = allJobs.filter(job => job.PortfolioID === portfolioId);
            setFilteredJobs(filtered);
        }
    }, [selectedPortfolioId, allJobs]);

    // Group portfolios by department for the sidebar display
    const groupedPortfolios = useMemo(() => {
        if (!portfolios.length) return {};
        return portfolios.reduce((acc, portfolio) => {
            const deptName = portfolio.department?.DepartmentName || 'UNCATEGORIZED';
            if (!acc[deptName]) {
                acc[deptName] = [];
            }
            acc[deptName].push(portfolio);
            return acc;
        }, {});
    }, [portfolios]);

    // ----- Sub-components for better readability -----

    const Sidebar = () => (
        <nav style={styles.sidebar}>
            <h2>Portfolios</h2>
            <div
                style={selectedPortfolioId === 'all' ? styles.sidebarItemActive : styles.sidebarItem}
                onClick={() => setSelectedPortfolioId('all')}
            >
                All Portfolios
            </div>
            <hr style={styles.hr}/>
            {Object.entries(groupedPortfolios).map(([deptName, portfs]) => (
                <div key={deptName}>
                    <h4 style={styles.deptHeader}>{deptName}</h4>
                    {portfs.map(p => (
                        <div
                            key={p.PortfolioID}
                            style={selectedPortfolioId === p.PortfolioID ? styles.sidebarItemActive : styles.sidebarItem}
                            onClick={() => setSelectedPortfolioId(p.PortfolioID)}
                        >
                            {p.PortfolioName}
                        </div>
                    ))}
                </div>
            ))}
        </nav>
    );

    const MainContent = () => {
        const userRole = user?.role ? user.role.toUpperCase() : '';

        return (
            <main style={styles.mainContent}>
                <header style={styles.header}>
                    <h1>Dashboard</h1>
                    <div>
                        {/* Role-based buttons */}
                        {userRole === 'ADMIN' && (
                            <button onClick={() => navigate('/admin/settings')} style={{...styles.button, ...styles.adminButton}}>
                                Admin Panel
                            </button>
                        )}
                        
                        {userRole === 'HR' && (
                            <button onClick={() => navigate('/manage-jobs')} style={{...styles.button, ...styles.hrButton}}>
                                Create Job
                            </button>
                        )}

                        <button onClick={logout} style={{...styles.button, ...styles.logoutButton}}>
                            Logout
                        </button>
                    </div>
                </header>
                <div style={styles.welcomeMessage}>
                    Welcome, <strong>{user?.email}</strong>! (Role: {user?.role})
                </div>
                <h2>Active Job Postings</h2>
                {isLoading ? (
                    <p>Loading jobs...</p>
                ) : error ? (
                    <p style={styles.error}>{error}</p>
                ) : (
                    <div style={styles.jobList}>
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map(job => (
                                <div 
                                    key={job.JobID} 
                                    style={styles.jobCard}
                                    onClick={() => navigate(`/pipeline/${job.JobID}`)}
                                >
                                    <h3>{job.JobTitle}</h3>
                                    <p>Status: <span style={styles.status}>{job.Status}</span></p>
                                </div>
                            ))
                        ) : (
                            <p>No active job postings found for this selection.</p>
                        )}
                    </div>
                )}
            </main>
        );
    };

    return (
        <div style={styles.container}>
            <Sidebar />
            <MainContent />
        </div>
    );
}

const styles = {
    container: { display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' },
    sidebar: {
        width: '240px',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRight: '1px solid #dee2e6',
        height: '100vh',
        overflowY: 'auto',
        flexShrink: 0
    },
    sidebarItem: {
        padding: '10px 15px',
        cursor: 'pointer',
        borderRadius: '5px',
        marginBottom: '5px',
        fontWeight: '500',
        fontSize: '15px',
        transition: 'background-color 0.2s',
    },
    sidebarItemActive: {
        padding: '10px 15px',
        cursor: 'pointer',
        borderRadius: '5px',
        marginBottom: '5px',
        backgroundColor: '#007bff',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '15px',
    },
    deptHeader: {
        marginTop: '20px',
        marginBottom: '10px',
        paddingLeft: '15px',
        fontSize: '12px',
        color: '#6c757d',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    hr: {
        border: 'none',
        borderTop: '1px solid #dee2e6',
        margin: '10px 0'
    },
    mainContent: {
        flex: 1,
        padding: '20px 40px',
        overflowY: 'auto',
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px' },
    welcomeMessage: { padding: '15px', backgroundColor: '#eef5ff', borderRadius: '8px', margin: '20px 0', textAlign: 'center' },
    jobList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' },
    jobCard: { 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px', 
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
        cursor: 'pointer', 
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    status: { backgroundColor: '#28a745', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' },
    button: { padding: '8px 15px', fontSize: '14px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' },
    adminButton: { backgroundColor: '#ffc107', color: 'black' },
    hrButton: { backgroundColor: '#17a2b8' },
    logoutButton: { backgroundColor: '#6c757d' },
    error: { color: 'red' },
};

export default DashboardPage;