// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    console.log('[AuthContext] Component rendering. Token is:', authToken, 'User is:', user);

    useEffect(() => {
        console.log('[AuthContext] useEffect triggered because authToken changed to:', authToken);
        if (authToken) {
            try {
                const decoded = jwtDecode(authToken);
                console.log('[AuthContext] Token successfully decoded:', decoded);
                
                if (decoded.exp * 1000 < Date.now()) {
                    console.error('[AuthContext] TOKEN EXPIRED. Logging out.');
                    logout();
                } else {
                    console.log('[AuthContext] Setting user state with:', { email: decoded.sub, role: decoded.role });
                    setUser({ email: decoded.sub, role: decoded.role });
                }
            } catch (error) {
                console.error('[AuthContext] ERROR: Failed to decode token. Logging out.', error);
                logout();
            }
        } else {
            console.log('[AuthContext] AuthToken is null, setting user to null.');
            setUser(null);
        }
    }, [authToken]);

    const login = (token) => {
        console.log('[AuthContext] Login function CALLED with token:', token);
        localStorage.setItem('authToken', token);
        setAuthToken(token);
    };

    const logout = () => {
        console.log('[AuthContext] Logout function CALLED.');
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
        navigate('/login');
    };

    const value = { authToken, user, login, logout };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};