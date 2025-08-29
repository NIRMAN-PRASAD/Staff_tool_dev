// frontend/src/pages/AuthPage.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

// MUI Components
import { Container, Box, Typography, TextField, Button, Paper, Avatar, Link, CircularProgress, Alert } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function AuthPage() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    
    const [loginStep, setLoginStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const inputRefs = useRef([]);

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await axiosInstance.post('/users/login/request-otp', { email });
            setLoginStep(2);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to request OTP. Please check the email and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const finalOtp = otp.join('');
        if (finalOtp.length !== 6) {
            setError('Please enter the complete 6-digit code.');
            setIsLoading(false);
            return;
        }
        try {
            const response = await axiosInstance.post('/users/login/verify-otp', { email, otp: finalOtp });
            login(response.data.access_token);
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid OTP or session expired.');
            setIsLoading(false);
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return;
        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };

    const Header = () => (
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>VeHIRE</Typography>
            <Typography variant="body2" color="text.secondary">AI Powered Recruitment</Typography>
        </Box>
    );

    return (
        <Container component="main" maxWidth="xs" sx={{ backgroundColor: 'background.default', height: '100vh', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Header />
                <Paper elevation={0} sx={{ p: 4, width: '100%', bgcolor: 'secondary.main' }}>
                    {loginStep === 1 ? (
                        <Box component="form" onSubmit={handleRequestOtp}>
                            <Typography variant="h5" align="center" sx={{ mb: 1, fontWeight: 'medium' }}>Welcome</Typography>
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                                Enter your email to receive a verification code
                            </Typography>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                InputProps={{
                                    startAdornment: <EmailOutlinedIcon color="action" sx={{ mr: 1 }} />,
                                    sx: { bgcolor: 'white' }
                                }}
                            />
                            <Button type="submit" fullWidth variant="contained" color="primary" disabled={isLoading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Get Verification Code'}
                            </Button>
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleVerifyOtp}>
                            <Typography variant="h5" align="center" sx={{ mb: 1, fontWeight: 'medium' }}>Verify Your Email</Typography>
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                                We've sent a 6-digit code to <br /> <strong>{email}</strong>
                            </Typography>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                                {otp.map((data, index) => (
                                    <TextField
                                        key={index}
                                        value={data}
                                        onChange={e => handleOtpChange(e.target, index)}
                                        onKeyDown={e => handleKeyDown(e, index)}
                                        onFocus={e => e.target.select()}
                                        inputRef={el => (inputRefs.current[index] = el)}
                                        required
                                        inputProps={{ maxLength: 1, style: { textAlign: 'center' } }}
                                        sx={{ width: 50,heigth : 50, bgcolor: 'white', borderRadius: 1 }}
                                    />
                                ))}
                            </Box>
                            <Button type="submit" fullWidth variant="contained" color="primary" disabled={isLoading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Continue'}
                            </Button>
                        </Box>
                    )}
                </Paper>
                {loginStep === 2 && (
                    <Link
                        component="button"
                        variant="body2"
                        onClick={() => { setLoginStep(1); setError(''); }}
                        sx={{ mt: 3, display: 'flex', alignItems: 'center', color: 'text.secondary', textDecoration: 'none' }}
                    >
                        <ArrowBackIcon sx={{ mr: 0.5, fontSize: '1rem' }} /> Back to Login
                    </Link>
                )}
            </Box>
        </Container>
    );
}

export default AuthPage;