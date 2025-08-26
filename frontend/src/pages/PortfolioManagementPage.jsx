// frontend/src/pages/PortfolioManagementPage.jsx

import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

function PortfolioManagementPage() {
    const navigate = useNavigate();
    const [portfolioName, setPortfolioName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreatePortfolio = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            await axiosInstance.post('/portfolios/', {
                PortfolioName: portfolioName,
                Description: description,
            });
            setSuccess(`Portfolio "${portfolioName}" created successfully!`);
            setPortfolioName('');
            setDescription('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create portfolio.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <button onClick={() => navigate('/admin-settings')} style={styles.backButton}>
                &larr; Back to Admin Settings
            </button>
            <h1>Manage Portfolios</h1>
            <div style={styles.formContainer}>
                <h3>Create New Portfolio</h3>
                <form onSubmit={handleCreatePortfolio}>
                    <div style={styles.formGroup}>
                        <label htmlFor="portfolioName">Portfolio Name</label>
                        <input
                            id="portfolioName"
                            type="text"
                            value={portfolioName}
                            onChange={(e) => setPortfolioName(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="description">Description (Optional)</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                            style={styles.input}
                        />
                    </div>
                    <button type="submit" disabled={isLoading} style={styles.button}>
                        {isLoading ? 'Creating...' : 'Create Portfolio'}
                    </button>
                </form>
                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>{success}</p>}
            </div>
            {/* You can add a list of existing portfolios here later */}
        </div>
    );
}

const styles = {
    container: { maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
    formContainer: { padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' },
    formGroup: { marginBottom: '20px' },
    input: { width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' },
    button: { padding: '12px 20px', fontSize: '16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    backButton: { marginBottom: '20px', padding: '8px 15px', cursor: 'pointer', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' },
    error: { color: 'red', marginTop: '10px', fontWeight: 'bold' },
    success: { color: 'green', marginTop: '10px', fontWeight: 'bold' },
};

export default PortfolioManagementPage;