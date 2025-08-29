// frontend/src/App.jsx

import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import './App.css'; // You can keep this for global styles if needed

// Import the new Master Layout
import AppLayout from './components/AppLayout.jsx';

// Import all your pages
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import JobManagementPage from './pages/JobManagementPage.jsx';
import CandidatePipelinePage from './pages/CandidatePipelinePage.jsx'; // Keep this for later
import AdminSettingsPage from './pages/AdminSettings.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import PortfolioManagementPage from './pages/PortfolioManagementPage.jsx';
import DepartmentManagementPage from './pages/DepartmentManagementPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

/**
 * A wrapper component that handles authentication and authorization.
 * If the user is authenticated, it wraps the page content with the main AppLayout.
 * Otherwise, it redirects to the login page.
 */
const PrivateRoute = ({ children, requiredRole }) => {
    const { user, authToken } = useAuth();

    if (!authToken || !user) {
        return <Navigate to="/login" />;
    }

    // Optional: Role-based access control
    if (requiredRole && user.role !== requiredRole) {
        // You can redirect to a dedicated "403 Forbidden" page if you want
        return <Navigate to="/dashboard" />;
    }

    // If authorized, render the page inside the main layout
    return <AppLayout>{children}</AppLayout>;
};


function App() {
  const { authToken } = useAuth();
  
  return (
    <div className="App">
        <Routes>
          {/* Public Route: Does NOT use the AppLayout */}
          <Route path="/login" element={<AuthPage />} />

          {/* Redirect root path */}
          <Route path="/" element={authToken ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

          {/* --- Protected Routes (All routes below will have the header and sidebar) --- */}
          
          <Route path="/dashboard" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          }/>

          <Route path="/manage-jobs" element={
            <PrivateRoute requiredRole="Admin"><JobManagementPage /></PrivateRoute>
          }/>
          
          <Route path="/pipeline/:jobId" element={
            <PrivateRoute><CandidatePipelinePage /></PrivateRoute>
          }/>

          <Route path="/manage-portfolios" element={
            <PrivateRoute requiredRole="Admin"><PortfolioManagementPage /></PrivateRoute>
          }/>
          
          <Route path="/manage-departments" element={
            <PrivateRoute requiredRole="Admin"><DepartmentManagementPage /></PrivateRoute>
          }/>

          {/* 
            NOTE: Your old /admin/ routes are now top-level for simplicity.
            The `AppLayout` handles the UI, and the routes handle the logic.
          */}
          <Route path="/users" element={
            <PrivateRoute requiredRole="Admin"><UserManagementPage /></PrivateRoute>
          }/>

          <Route path="/settings" element={
            <PrivateRoute requiredRole="Admin"><AdminSettingsPage /></PrivateRoute>
          }/>

          {/* Catch-all route for pages that don't exist */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
    </div>
  );
}

export default App;