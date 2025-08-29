// frontend/src/pages/DashboardPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axiosInstance from '../api/axiosInstance';

function DashboardPage() {
    const { user, authToken, logout } = useAuth();
    const navigate = useNavigate();

    // Data state
    const [jobs, setJobs] = useState([]); // Will hold the filtered jobs
    const [portfolios, setPortfolios] = useState([]);
    
    // UI State for filtering
    const [selectedFilter, setSelectedFilter] = useState({ type: 'all', id: null });
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch portfolios once on page load
    useEffect(() => {
        const fetchPortfolioData = async () => {
            if (!authToken) return;
            try {
                const portfoliosResponse = await axiosInstance.get('/portfolios/');
                setPortfolios(portfoliosResponse.data);
            } catch (err) {
                setError('Failed to fetch portfolio data.');
            }
        };
        fetchPortfolioData();
    }, [authToken]);
    
    // Fetch jobs whenever the filter changes
    useEffect(() => {
        const fetchJobs = async () => {
            if (!authToken) return;
            setIsLoading(true);
            
            let url = '/jobs/';
            if (selectedFilter.type === 'department' && selectedFilter.id) {
                url = `/jobs/?department_id=${selectedFilter.id}`;
            }
            
            try {
                const jobsResponse = await axiosInstance.get(url);
                setJobs(jobsResponse.data);
            } catch (err) {
                 setError('Failed to fetch job data.');
                 console.error("Fetch jobs error:", err.response ? err.response.data : err);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchJobs();
    }, [authToken, selectedFilter]); // Re-run effect when filter changes

    // Grouping logic for the sidebar UI
    const sidebarData = useMemo(() => {
        const data = {};
        portfolios.forEach(portfolio => {
            portfolio.departments.forEach(dept => {
                if (!data[dept.DepartmentName]) {
                    data[dept.DepartmentName] = { id: dept.DepartmentID, portfolios: [] };
                }
                data[dept.DepartmentName].portfolios.push(portfolio.PortfolioName);
            });
        });
        return data;
    }, [portfolios]);
    
    const Sidebar = () => (
        <nav style={styles.sidebar}>
            <h2>Filter by</h2>
            <div
                style={selectedFilter.type === 'all' ? styles.sidebarItemActive : styles.sidebarItem}
                onClick={() => setSelectedFilter({ type: 'all', id: null })}
            >
                All Jobs
            </div>
            <hr style={styles.hr}/>
            {Object.entries(sidebarData).map(([deptName, deptInfo]) => (
                <div key={deptInfo.id}>
                    {/* Department name is now clickable */}
                    <h4 
                        style={selectedFilter.type === 'department' && selectedFilter.id === deptInfo.id ? styles.deptHeaderActive : styles.deptHeader}
                        onClick={() => setSelectedFilter({ type: 'department', id: deptInfo.id })}
                    >
                        {deptName}
                    </h4>
                    {/* Portfolios are just informational labels */}
                    {deptInfo.portfolios.map(pName => (
                        <div key={pName} style={styles.portfolioLabel}>
                            - {pName}
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
                         {userRole === 'ADMIN' && (
                            <button onClick={() => navigate('/admin/settings')} style={{...styles.button, ...styles.adminButton}}>
                                Admin Panel
                            </button>
                        )}
                        {(userRole === 'HR' || userRole === 'ADMIN') && (
                            <button onClick={() => navigate('/manage-jobs')} style={{...styles.button, ...styles.hrButton}}>
                                Create Job
                            </button>
                        )}
                        <button onClick={logout} style={{...styles.button, ...styles.logoutButton}}>Logout</button>
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
                        {jobs.length > 0 ? (
                            jobs.map(job => (
                                <div 
                                    key={job.JobID} 
                                    style={styles.jobCard}
        // --- THIS IS THE LINE TO CHANGE ---
                                    onClick={() => navigate(`/pipeline/${job.JobID}`)} 
                                >
                                    <h3>{job.JobTitle}</h3>
                                    <p>Status: <span style={{...styles.status, backgroundColor: job.Status === 'Open' ? '#28a745' : '#6c757d'}}>{job.Status}
                                </span></p>
                            </div>
                        ))
                        ) : (
                            <p>No active job postings found for this filter.</p>
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
    sidebarItem: { padding: '10px 15px', cursor: 'pointer', borderRadius: '5px', marginBottom: '5px', fontWeight: '500' },
    sidebarItemActive: { padding: '10px 15px', cursor: 'pointer', borderRadius: '5px', marginBottom: '5px', backgroundColor: '#007bff', color: 'white', fontWeight: 'bold' },
    deptHeader: { marginTop: '20px', marginBottom: '5px', padding: '8px 15px', fontSize: '14px', color: '#343a40', textTransform: 'uppercase', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', transition: 'background-color 0.2s' },
    deptHeaderActive: { marginTop: '20px', marginBottom: '5px', padding: '8px 15px', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', backgroundColor: '#6c757d', color: 'white' },
    portfolioLabel: { paddingLeft: '25px', fontSize: '14px', color: '#6c757d', marginBottom: '5px' },
    hr: { border: 'none', borderTop: '1px solid #dee2e6', margin: '10px 0' },
    mainContent: { flex: 1, padding: '20px 40px', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px' },
    welcomeMessage: { padding: '15px', backgroundColor: '#eef5ff', borderRadius: '8px', margin: '20px 0', textAlign: 'center' },
    jobList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' },
    jobCard: { border: '1px solid #ddd', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
    status: { color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' },
    button: { padding: '8px 15px', fontSize: '14px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' },
    adminButton: { backgroundColor: '#ffc107', color: 'black' },
    hrButton: { backgroundColor: '#17a2b8' },
    logoutButton: { backgroundColor: '#dc3545' },
    error: { color: 'red' },
};

export default DashboardPage;