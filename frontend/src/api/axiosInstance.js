// frontend/src/api/axiosInstance.js

import axios from 'axios';

// <-- YAHAN CHANGE KIYA GAYA HAI -->
// Vite mein environment variables import.meta.env se access hote hain
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
    baseURL: API_URL,
});

// Yeh interceptor har request ke saath token add kar dega
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;