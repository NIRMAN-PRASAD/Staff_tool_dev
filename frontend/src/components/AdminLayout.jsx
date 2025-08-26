// frontend/src/components/AdminLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const AdminLayout = () => {
    const { logout } = useAuth();

    // Yeh style active link ko highlight karne ke liye hai
    const activeLinkStyle = {
        color: '#ffffff',
        borderBottom: '3px solid #e74c3c',
    };

    return (
        <div>
            <header style={styles.header}>
                <nav style={styles.nav}>
                    <NavLink to="/dashboard" style={styles.navLink}>Home</NavLink>
                    <NavLink 
                        to="/admin/users" 
                        style={({ isActive }) => isActive ? { ...styles.navLink, ...activeLinkStyle } : styles.navLink}
                    >
                        User Management
                    </NavLink>
                    <NavLink 
                        to="/admin/settings" 
                        style={({ isActive }) => isActive ? { ...styles.navLink, ...activeLinkStyle } : styles.navLink}
                    >
                        Admin Settings
                    </NavLink>
                </nav>
                <button onClick={logout} style={styles.logoutButton}>Logout</button>
            </header>
            <main style={styles.mainContent}>
                {/* Yahan aapke child pages (UserManagementPage ya AdminSettingsPage) render honge */}
                <Outlet />
            </main>
        </div>
    );
};

const styles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', padding: '0 40px', color: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    nav: { display: 'flex', gap: '30px', height: '100%' },
    navLink: { color: '#bdc3c7', textDecoration: 'none', padding: '20px 0', fontSize: '16px', borderBottom: '3px solid transparent', transition: 'color 0.2s, border-bottom 0.2s' },
    logoutButton: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontSize: '15px' },
    mainContent: { padding: '20px' }
};

export default AdminLayout;