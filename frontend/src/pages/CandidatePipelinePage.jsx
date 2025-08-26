// frontend/src/pages/CandidatePipelinePage.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

function CandidatePipelinePage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    
    const [candidates, setCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                // This is the endpoint we created in jobs.py
                const response = await axiosInstance.get(`/jobs/${jobId}/applications`);
                setCandidates(response.data);
            } catch (err) {
                setError("Failed to fetch candidates for this job.");
            } finally {
                setIsLoading(false);
            }
        };

        if (jobId) {
            fetchCandidates();
        }
    }, [jobId]);
    
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <button onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
            <h1>Candidate Pipeline for Job ID: {jobId}</h1>
            
            {isLoading && <p>Loading candidates...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}
            
            {!isLoading && candidates.length === 0 && <p>No candidates have applied for this job yet.</p>}
            
            {!isLoading && candidates.length > 0 && (
                <div>
                    <p>Found {candidates.length} candidates.</p>
                    {/* In the next step, we will build a proper table here */}
                </div>
            )}
        </div>
    );
}

export default CandidatePipelinePage;