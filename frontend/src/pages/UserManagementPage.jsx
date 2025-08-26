// frontend/src/pages/UserManagementPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance'; // Assuming you have this file
import { useNavigate } from 'react-router-dom';

const ROLES = ['HR', 'Admin', 'Interviewer'];

// --- UserRow Sub-component ---
function UserRow({ user, onUserUpdate, onUserDelete }) {
    const [selectedRole, setSelectedRole] = useState(user.Role);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleRoleChange = async () => {
        setIsUpdating(true);
        try {
            await axiosInstance.put(`/users/${user.UserID}/role`, { role: selectedRole });
            onUserUpdate(); // Notify parent to refresh
        } catch (error) {
            alert(`Failed to update role: ${error.response?.data?.detail || 'Server error'}`);
            setSelectedRole(user.Role); // Revert on failure
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete user ${user.Email}?`)) {
            onUserDelete(user.UserID);
        }
    };

    return (
        <tr>
            <td style={styles.td}>{user.UserID}</td>
            <td style={styles.td}>{user.UserName}</td>
            <td style={styles.td}>{user.Email}</td>
            <td style={styles.td}>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={styles.input}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </td>
            <td style={styles.td}>
                <button onClick={handleRoleChange} disabled={isUpdating || selectedRole === user.Role} style={styles.actionButton}>
                    {isUpdating ? 'Saving...' : 'Update'}
                </button>
                <button onClick={handleDelete} style={{...styles.actionButton, ...styles.deleteButton}}>
                    Delete
                </button>
            </td>
        </tr>
    );
}

// --- Main Page Component ---
function UserManagementPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [email, setEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [role, setRole] = useState('HR');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchUsers = useCallback(async () => {
        setIsLoading(true); setError('');
        try {
            const response = await axiosInstance.get('/users/');
            setUsers(response.data);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to fetch users.';
            setError(typeof msg === 'string' ? msg : 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreateUser = async (event) => {
        event.preventDefault();
        setError(''); setSuccessMessage('');
        try {
            await axiosInstance.post('/users/', { Email: email, UserName: userName, Role: role });
            setSuccessMessage(`Successfully created user: ${email}`);
            setEmail(''); setUserName('');
            fetchUsers();
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to create user.';
            setError(typeof msg === 'string' ? msg : 'An error occurred.');
        }
    };
    
    const handleDeleteUser = async (userId) => {
        setError('');
        try {
            await axiosInstance.delete(`/users/${userId}`);
            fetchUsers();
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to delete user.';
            setError(typeof msg === 'string' ? msg : 'An error occurred.');
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>User Management</h1>
            
            <div style={styles.formContainer}>
                <h3>Create New User</h3>
                <form onSubmit={handleCreateUser} style={styles.form}>
                    <input type="email" placeholder="New User Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
                    <input type="text" placeholder="New User Name" value={userName} onChange={(e) => setUserName(e.target.value)} required style={styles.input} />
                    <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button type="submit" style={styles.createButton}>Create User</button>
                </form>
                {successMessage && <p style={styles.success}>{successMessage}</p>}
            </div>
            
            <h3 style={{marginTop: '40px'}}>Existing Users</h3>
            {error && <p style={styles.error}>{error}</p>}
            {isLoading ? ( <p>Loading users...</p> ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th><th style={styles.th}>Name</th><th style={styles.th}>Email</th><th style={styles.th}>Role</th><th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <UserRow key={user.UserID} user={user} onUserUpdate={fetchUsers} onUserDelete={handleDeleteUser} />
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const styles = {
    container: { maxWidth: '1000px', margin: '20px auto', padding: '0 20px', fontFamily: 'Arial, sans-serif' },
    title: { marginBottom: '30px' },
    formContainer: { backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '8px', border: '1px solid #ddd' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' },
    createButton: { padding: '12px', fontSize: '16px', color: 'white', backgroundColor: '#28a745', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { borderBottom: '2px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2', textAlign: 'left', fontWeight: 'bold' },
    td: { borderBottom: '1px solid #ddd', padding: '12px', verticalAlign: 'middle' },
    actionButton: { padding: '8px 12px', fontSize: '12px', color: 'white', backgroundColor: '#007BFF', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' },
    deleteButton: { backgroundColor: '#dc3545' },
    error: { color: 'red', textAlign: 'center', fontWeight: 'bold', padding: '10px', backgroundColor: '#fdd' },
    success: { color: 'green', textAlign: 'center', fontWeight: 'bold', padding: '10px', backgroundColor: '#dfd' },
};

export default UserManagementPage;