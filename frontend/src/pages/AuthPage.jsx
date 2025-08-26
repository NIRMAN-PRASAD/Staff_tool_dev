import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// <-- YAHAN CHANGE HUA HAI -->
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function AuthPage() {
    const { login } = useAuth();
    const [loginStep, setLoginStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestOtp = async (event) => {
        event.preventDefault();
        setIsLoading(true); setError(''); setMessage('');
        try {
            const response = await axios.post(`${API_URL}/users/login/request-otp`, { email });
            setMessage(response.data.message);
            setLoginStep(2);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to request OTP. Make sure the backend server is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        setIsLoading(true); setError('');
        try {
            const response = await axios.post(`${API_URL}/users/login/verify-otp`, { email, otp });
            const receivedToken = response.data.access_token;
            login(receivedToken);
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed! The OTP might be incorrect or expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (loginStep === 1) {
        return (
            <div style={styles.container}>
                <h2>Login to Staffing Tool</h2>
                <p>Please enter your email to receive a login code.</p>
                <form onSubmit={handleRequestOtp} style={styles.form}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
                    <button type="submit" disabled={isLoading} style={styles.button}>{isLoading ? 'Sending...' : 'Send OTP'}</button>
                    {error && <p style={styles.error}>{error}</p>}
                </form>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2>Enter Verification Code</h2>
            <p style={styles.message}>{message}</p>
            <form onSubmit={handleVerifyOtp} style={styles.form}>
                <input type="text" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6" style={styles.input} />
                <button type="submit" disabled={isLoading} style={styles.button}>{isLoading ? 'Verifying...' : 'Login'}</button>
                {error && <p style={styles.error}>{error}</p>}
                <button type="button" onClick={() => { setLoginStep(1); setError(''); }} style={styles.backButton}>Back to email</button>
            </form>
        </div>
    );
}

const styles = {
    container: { maxWidth: '400px', margin: '100px auto', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: 'white' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' },
    button: { padding: '12px', fontSize: '16px', color: 'white', backgroundColor: '#007BFF', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    backButton: { background: 'none', border: 'none', color: '#007BFF', cursor: 'pointer', marginTop: '10px' },
    error: { color: 'red', textAlign: 'center', fontWeight: 'bold' },
    message: { color: 'green', textAlign: 'center' },
};

export default AuthPage;