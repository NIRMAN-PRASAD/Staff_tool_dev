// frontend/src/pages/AdminSettings.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminSettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Admin Settings</h1>
            <p style={styles.subtitle}>Select an option below to manage your organization's structure.</p>
            <div style={styles.cardContainer}>
                <div 
                    style={styles.card} 
                    onClick={() => navigate('/manage-portfolios')}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <h2>Manage Portfolios</h2>
                    <p>Create and view all portfolio companies.</p>
                </div>
                <div 
                    style={styles.card} 
                    onClick={() => navigate('/manage-departments')}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <h2>Manage Departments</h2>
                    <p>Create new departments for your portfolios.</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { maxWidth: '900px', margin: '40px auto', fontFamily: 'Arial, sans-serif' },
    title: { textAlign: 'center', fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' },
    subtitle: { textAlign: 'center', color: '#7f8c8d', fontSize: '1.1rem', marginBottom: '50px' },
    cardContainer: { display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' },
    card: { 
        width: '320px', 
        padding: '30px', 
        border: '1px solid #ecf0f1', 
        borderRadius: '8px', 
        textAlign: 'center', 
        cursor: 'pointer', 
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        backgroundColor: 'white',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
    },
};

export default AdminSettingsPage;