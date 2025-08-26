// frontend/src/App.jsx

import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import './App.css';

// Import Layouts
import AdminLayout from './components/AdminLayout.jsx';

// Import Pages
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import AdminSettingsPage from './pages/AdminSettings.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import JobManagementPage from './pages/JobManagementPage.jsx';
import PortfolioManagementPage from './pages/PortfolioManagementPage.jsx';
import DepartmentManagementPage from './pages/DepartmentManagementPage.jsx';
import CandidatePipelinePage from './pages/CandidatePipelinePage.jsx';

const PrivateRoute = ({ children, requiredRole }) => {
    const { user, authToken } = useAuth();
    if (!authToken || !user) {
        return <Navigate to="/login" />;
    }

    const userRole = user.role.toUpperCase();
    
    // An Admin can access any route, even those specifically for HR
    if (userRole === 'ADMIN') {
        return children;
    }
    
    // For other roles, check if the role matches
    if (requiredRole && userRole !== requiredRole.toUpperCase()) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h1>403 - Forbidden</h1>
                <p>You do not have permission to access this page.</p>
                <a href="/dashboard">Go back to Dashboard</a>
            </div>
        );
    }
    
    return children;
};

function App() {
  const { authToken } = useAuth();
  
  return (
    <div className="App">
      <main>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={authToken ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

          {/* Standard Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/manage-jobs" element={<PrivateRoute requiredRole="HR"><JobManagementPage /></PrivateRoute>} />
          <Route path="/manage-portfolios" element={<PrivateRoute requiredRole="Admin"><PortfolioManagementPage /></PrivateRoute>} />
          <Route path="/manage-departments" element={<PrivateRoute requiredRole="Admin"><DepartmentManagementPage /></PrivateRoute>} />
          <Route path="/pipeline/:jobId" element={<PrivateRoute><CandidatePipelinePage /></PrivateRoute>} />
          
          {/* --- ADMIN SECTION with Nested Layout --- */}
          <Route 
            path="/admin" 
            element={<PrivateRoute requiredRole="Admin"><AdminLayout /></PrivateRoute>}
          >
            {/* Default route for /admin will redirect to /admin/users */}
            <Route index element={<Navigate to="users" replace />} /> 
            
            {/* Route for the user management table */}
            <Route path="users" element={<UserManagementPage />} /> 
            
            {/* Route for the settings page with cards */}
            <Route path="settings" element={<AdminSettingsPage />} /> 
          </Route>
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;