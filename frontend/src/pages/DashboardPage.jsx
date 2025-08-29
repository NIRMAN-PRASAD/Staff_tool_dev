// frontend/src/pages/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

// MUI Components
import { Box, Typography, Grid, Card, Button, List, ListItem, ListItemText, Divider, Avatar, IconButton, CircularProgress } from '@mui/material';

// MUI Icons
import AddIcon from '@mui/icons-material/Add';
import PageviewOutlinedIcon from '@mui/icons-material/PageviewOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

function DashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentJobs, setRecentJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [statsRes, jobsRes] = await Promise.all([
                axiosInstance.get('/reports/dashboard-stats'),
                axiosInstance.get('/jobs/?limit=5')
            ]);
            setStats(statsRes.data);
            setRecentJobs(jobsRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const StatCard = ({ title, value, percentage }) => (
        <Grid item xs={12} sm={6} lg={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#e0e0e0' }}>
                <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">{title}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>{value}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#dcfce7' }} />
                        <Typography variant="caption" color="text.secondary">{percentage}</Typography>
                    </Box>
                </Box>
            </Card>
        </Grid>
    );

    const ActionCard = ({ title, icon, onClick }) => (
        <Grid item xs={12} sm={6} lg={4}>
            <Button
                fullWidth
                variant="outlined"
                onClick={onClick}
                startIcon={icon}
                sx={{
                    justifyContent: 'flex-start',
                    p: 2,
                    borderRadius: 3,
                    borderColor: '#e0e0e0',
                    color: 'text.primary',
                    bgcolor: 'white', // Ensure background is white
                    textTransform: 'none',
                    // --- HOVER EFFECT FIX ---
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'white', // Keep background white on hover
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                    },
                    '& .MuiButton-startIcon': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        p: 1,
                        borderRadius: 2,
                        mr: 1.5,
                    }
                }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>{title}</Typography>
            </Button>
        </Grid>
    );

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Dashboard</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Welcome back! Here’s your recruitment overview.
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                {stats && <>
                    <StatCard title="Total Jobs Posted" value={stats.total_jobs_posted} percentage="+12%" />
                    <StatCard title="Total Candidates" value={stats.total_candidates} percentage="+23%" />
                    <StatCard title="Active Interviewers" value={stats.active_interviewers} percentage="+5%" />
                    <StatCard title="Selected Candidates" value={stats.selected_candidates} percentage="+8%" />
                </>}
            </Grid>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <ActionCard title="Create New Job" icon={<AddIcon />} onClick={() => navigate('/manage-jobs')} />
                <ActionCard title="Screen Resumes" icon={<PageviewOutlinedIcon />} onClick={() => navigate('/screening')} />
                <ActionCard title="Schedule Interviews" icon={<EventAvailableIcon />} />
            </Grid>

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Recent Jobs</Typography>
                    <Button variant="outlined" sx={{ borderRadius: 2 }}>View All Jobs</Button>
                </Box>
                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#e0e0e0', bgcolor: 'white' }}>
                    <List sx={{ p: 0 }}>
                        {recentJobs.map((job, index) => (
                            <React.Fragment key={job.JobID}>
                                <ListItem
                                    onClick={() => navigate(`/pipeline/${job.JobID}`)}
                                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, py: 2 }}
                                    secondaryAction={
                                        <Box>
                                            <IconButton><VisibilityOutlinedIcon /></IconButton>
                                            <IconButton><MoreHorizIcon /></IconButton>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={job.JobTitle}
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mt: 0.5 }}>
                                                <Typography component="span" variant="body2" color="text.secondary">Concertiv</Typography>•
                                                <Typography component="span" variant="body2" color="text.secondary">{job.JobType || 'Full Time'}</Typography>•
                                                <Typography component="span" variant="body2" color="text.secondary">45 applicants</Typography>•
                                                <Typography component="span" variant="body2" color="text.secondary">2 days ago</Typography>
                                            </Box>
                                        }
                                        primaryTypographyProps={{ fontWeight: 'medium', fontSize: '1.1rem' }}
                                    />
                                </ListItem>
                                {index < recentJobs.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Card>
            </Box>
        </Box>
    );
}

export default DashboardPage;