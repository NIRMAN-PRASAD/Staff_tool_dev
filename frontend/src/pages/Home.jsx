import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    const userData = authService.decodeToken(token);
    if (!userData) {
      handleLogout();
    } else {
      setUser(userData);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container">
      <nav>
        <div>
          <Link to="/">Home</Link>
          {user.role === 'Admin' && <Link to="/users">User Management</Link>}
          {/* --- ADDED THIS NEW ADMIN LINK --- */}
          {user.role === 'Admin' && <Link to="/admin/settings">Admin Settings</Link>}
        </div>
        <button onClick={handleLogout}>Logout</button>
      </nav>

      <h1>Welcome, {user.sub.split('@')[0]}!</h1>
      <p>Your role is: <strong>{user.role}</strong></p>
      <hr />

      {/* --- UPDATED BUTTONS TO BECOME A SINGLE LINK --- */}
      {user.role === 'Admin' && (
        <div>
          <h2>Admin Actions</h2>
          <Link to="/admin/settings">
            <button>Manage Portfolios & Departments</button>
          </Link>
        </div>
      )}

      {user.role === 'HR' && (
        <div>
          <h2>HR Actions</h2>
          <Link to="/create-job"><button>Create a Job</button></Link>
        </div>
      )}
    </div>
  );
}

export default Home;