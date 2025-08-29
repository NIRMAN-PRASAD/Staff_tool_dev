// frontend/src/components/AppLayout.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// MUI Components
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  IconButton, Avatar, InputBase, Menu, MenuItem, 
  ListItem, ListItemButton, ListItemIcon, ListItemText 
} from '@mui/material';

// MUI Icons
import MenuIcon from '@mui/icons-material/Menu'; 
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PageviewIcon from '@mui/icons-material/Pageview';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Job Management', icon: <WorkOutlineIcon />, path: '/manage-jobs' },
  { text: 'Resume Screening', icon: <PageviewIcon />, path: '/screening' },
  { text: 'Talent Pool', icon: <GroupWorkIcon />, path: '/talent-pool' },
  { text: 'Report', icon: <AssessmentOutlinedIcon />, path: '/reports' },
  { text: 'Configuration', icon: <SettingsOutlinedIcon />, path: '/settings' },
];

export default function AppLayout({ children }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logout(); };

  return (
    <Box sx={{ display: 'flex' }}>
      
      {/* Top AppBar */}
      <AppBar 
        position="fixed"
        sx={{ 
          width: `calc(100% - ${drawerWidth}px)`, 
          ml: `${drawerWidth}px`,
          bgcolor: 'white', 
          color: 'text.primary', 
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
        }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          
          {/* Search Bar */}
          <Box sx={{ position: 'relative', borderRadius: 2, bgcolor: 'grey.100', width: '350px' }}>
            <Box sx={{ padding: '0 16px', height: '100%', position: 'absolute', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <SearchIcon color="action" />
            </Box>
            <InputBase 
              placeholder="Search…" 
              sx={{ 
                color: 'inherit', 
                width: '100%', 
                '& .MuiInputBase-input': { padding: '8px 8px 8px calc(1em + 32px)' } 
              }} 
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* User Avatar + Menu */}
          <IconButton onClick={handleMenu} size="large" color="inherit">
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '1rem' }}>
              {user?.email?.[0].toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Left Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #e0e0e0'
          },
        }}
      >
        {/* Logo Section */}
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', p: 2, gap: 1 }}>
          <Avatar variant="rounded" sx={{ bgcolor: 'grey.300', color: 'text.primary', fontWeight: 'bold' }}>V</Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>VeHIRE</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>AI Powered Recruitment</Typography>
          </Box>
        </Toolbar>
        <Divider />

        {/* Menu Items */}
        <Box sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">MENU</Typography>
          <List component="nav">
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'transparent',
                      color: 'text.primary',
                      fontWeight: 'bold',
                      '& .MuiListItemIcon-root': { color: 'text.primary' },
                    },
                    '&.Mui-selected:hover': {
                      bgcolor: 'grey.100', // subtle hover effect
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto', bgcolor: 'grey.50' }}>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
