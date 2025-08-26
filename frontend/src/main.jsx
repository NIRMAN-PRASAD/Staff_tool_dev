// frontend/src/index.js (or main.jsx)

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// <-- YAHAN CHANGE KIYA GAYA HAI -->
// .js se .jsx kar diya hai
import { AuthProvider } from './context/AuthContext.jsx'; 
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);