// frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

// 1. Context create karna
const AuthContext = createContext(null);

// 2. Provider component banana jo poore app ko data dega
export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Yeh effect tab chalta hai jab bhi authToken badalta hai
    useEffect(() => {
        if (authToken) {
            try {
                const decoded = jwtDecode(authToken);

                // Check karo ki token expire toh nahi ho gaya
                if (decoded.exp * 1000 < Date.now()) {
                    logout(); // Expire ho gaya toh logout kar do
                } else {
                    // Token valid hai, toh user data set karo
                    // Backend 'sub' mein email bhejta hai
                    setUser({ email: decoded.sub, role: decoded.role });
                }
            } catch (error) {
                console.error("Invalid token found, logging out.");
                logout();
            }
        } else {
            setUser(null);
        }
    }, [authToken, navigate]); // navigate ko dependency array mein add karna acchi practice hai

    // Login function
    const login = (token) => {
        localStorage.setItem('authToken', token);
        setAuthToken(token);
        navigate('/dashboard'); // Login ke baad dashboard par bhejo
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
        navigate('/login'); // Logout ke baad login page par bhejo
    };

    // Yeh value poore app mein available hogi
    const value = {
        authToken,
        user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Custom hook banana taaki isko use karna aasan ho
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};