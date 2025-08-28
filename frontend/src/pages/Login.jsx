//frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Login() {
  const [email, setEmail] = useState('nirman.prasad@vearc.com');
  const [otp, setOtp] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const navigate = useNavigate();

  useEffect(() => {
    // Agar user pehle se logged in hai, to usse home page par bhej do
    if (localStorage.getItem('accessToken')) {
      navigate('/');
    }
  }, [navigate]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage({ text: '', isError: false });
    try {
      await authService.requestOtp(email);
      setMessage({ text: 'OTP sent successfully! Please check your email.', isError: false });
      setShowOtpForm(true);
    } catch (error) {
      setMessage({ text: error.response?.data?.detail || 'Failed to send OTP.', isError: true });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage({ text: '', isError: false });
    try {
      const response = await authService.verifyOtp(email, otp);
      localStorage.setItem('accessToken', response.data.access_token);
      navigate('/'); // Login successful, go to home
    } catch (error) {
      setMessage({ text: error.response?.data?.detail || 'Invalid OTP or session expired.', isError: true });
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <h1>Staffing Tool Login</h1>
      <form onSubmit={showOtpForm ? handleVerifyOtp : handleRequestOtp}>
        {!showOtpForm ? (
          <div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit">Get OTP</button>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label htmlFor="otp">OTP Code</label>
              <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="Enter OTP from email" />
            </div>
            <button type="submit">Login</button>
          </div>
        )}
      </form>
      {message.text && <div className={`message ${message.isError ? 'error' : 'success'}`}>{message.text}</div>}
    </div>
  );
}

export default Login;