// frontend/src/pages/DepartmentManagementPage.jsx

import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

function DepartmentManagementPage() {
    const navigate = useNavigate();
    
    const [departmentName, setDepartmentName] = useState('');
    const [description, setDescription] = useState('');
    const [portfolioId, setPortfolioId] = useState('');
    
    const [portfolios, setPortfolios] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPortfolios = async () => {
            try {
                const response = await axiosInstance.get('/portfolios/');
                setPortfolios(response.data);
                if (response.data.length > 0) {
                    setPortfolioId(response.data[0].PortfolioID);
                } else {
                    setError("No portfolios found. Please create a portfolio first.");
                }
            } catch (err) {
                // <-- YAHAN CHANGE KIYA GAYA HAI -->
                const errorMessage = err.response?.data?.detail || 'Failed to fetch portfolios.';
                setError(typeof errorMessage === 'string' ? errorMessage : 'An unknown error occurred.');
            }
        };
        fetchPortfolios();
    }, []);

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        const departmentData = {
            DepartmentName: departmentName,
            Description: description,
            PortfolioID: parseInt(portfolioId, 10),
        };

        try {
            await axiosInstance.post('/departments/', departmentData);
            setSuccess(`Department "${departmentName}" created successfully!`);
            setDepartmentName('');
            setDescription('');
        } catch (err) {
            // <-- YAHAN BHI CHANGE KIYA GAYA HAI -->
            const errorMessage = err.response?.data?.detail || 'Failed to create department.';
            // Handle complex Pydantic errors which might be arrays of objects
            if (Array.isArray(errorMessage)) {
                setError(errorMessage.map(e => `${e.loc[1]}: ${e.msg}`).join(', '));
            } else {
                setError(typeof errorMessage === 'string' ? errorMessage : 'An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <button onClick={() => navigate('/admin-settings')} style={styles.backButton}>
                &larr; Back to Admin Settings
            </button>
            <h1>Manage Departments</h1>
            <div style={styles.formContainer}>
                <h3>Create New Department</h3>
                <form onSubmit={handleCreateDepartment}>
                    <div style={styles.formGroup}>
                        <label htmlFor="portfolio">Assign to Portfolio (Required)</label>
                        <select
                            id="portfolio"
                            value={portfolioId}
                            onChange={(e) => setPortfolioId(e.target.value)}
                            required
                            style={styles.input}
                        >
                           {portfolios.length > 0 ? (
                                portfolios.map((p) => (
                                    <option key={p.PortfolioID} value={p.PortfolioID}>
                                        {p.PortfolioName}
                                    </option>
                                ))
                            ) : (
                                <option disabled>Please create a portfolio first</option>
                            )}
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="departmentName">New Department Name</label>
                        <input
                            id="departmentName"
                            type="text"
                            value={departmentName}
                            onChange={(e) => setDepartmentName(e.target.value)}
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
                    <button type="submit" disabled={isLoading || portfolios.length === 0} style={styles.button}>
                        {isLoading ? 'Creating...' : 'Create Department'}
                    </button>
                </form>
                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>{success}</p>}
            </div>
        </div>
    );
}
// Add styles object here
const styles = { /* ... */ }; 
export default DepartmentManagementPage;