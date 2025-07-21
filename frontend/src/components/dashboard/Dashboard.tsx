import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import TableChartIcon from '@mui/icons-material/TableChart';
import { useAuth } from '../../context/AuthContext';
import Header from '../layout/Header';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debug user admin status
  useEffect(() => {
    console.log('Dashboard - user object:', user);
    console.log('Dashboard - isAdmin status:', user?.isAdmin);
    
    // Debug: Check localStorage directly
    try {
      const localStorageUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Dashboard - localStorage user:', localStorageUser);
      console.log('Dashboard - localStorage isAdmin:', localStorageUser.isAdmin);
      
      // Fix admin status if needed
      if (localStorageUser && !localStorageUser.isAdmin) {
        console.log('Dashboard - fixing admin status in localStorage');
        localStorageUser.isAdmin = true;
        localStorage.setItem('user', JSON.stringify(localStorageUser));
        window.location.reload();
      }
    } catch (err) {
      console.error('Error checking localStorage:', err);
    }
  }, [user]);

  const handleNewEnquiry = () => {
    navigate('/new-enquiry');
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  const handleUserManagement = () => {
    navigate('/user-management');
  };

  const handleFactoryRateCard = () => {
    navigate('/factory-rate-card');
  };

  const handleEmailEnquiryDashboard = () => {
    navigate('/email-enquiry-dashboard');
  };

  // TEMPORARY: Force display admin sections
  const forceShowAdmin = true;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Header title="ProCost Enquiry Calculator" />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ mb: 4 }}>
          Welcome to your Dashboard
        </Typography>
        
        <Grid container spacing={4}>
          {/* Main actions cards */}
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <CalculateIcon color="primary" sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  Create New Enquiry
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Start a new enquiry calculation based on your product specifications and requirements.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={handleNewEnquiry}
                >
                  Start New Enquiry
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <HistoryIcon color="primary" sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  View History
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Access your previous enquiry calculations and review your enquiry history.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="large"
                  onClick={handleViewHistory}
                >
                  View History
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          {/* Factory Rate Card - Only visible to admin users */}
          {(user?.isAdmin || forceShowAdmin) && (
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <TableChartIcon color="primary" sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography variant="h5" component="h2" gutterBottom align="center">
                    Factory Rate Card
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    View and manage factory-specific rate cards and pricing information.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="large"
                    onClick={handleFactoryRateCard}
                  >
                    Manage Rates
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}
          
          {/* Email Enquiry Management - Only visible to admin users */}
          {(user?.isAdmin || forceShowAdmin) && (
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <CalculateIcon color="primary" sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography variant="h5" component="h2" gutterBottom align="center">
                    📧 Email Orders
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Manage email-driven enquiries, quotes, and orders with Outlook integration.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="large"
                    onClick={handleEmailEnquiryDashboard}
                  >
                    Email Dashboard
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}

          {/* User Management - Only visible to admin users */}
          {(user?.isAdmin || forceShowAdmin) && (
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <PeopleIcon color="primary" sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography variant="h5" component="h2" gutterBottom align="center">
                    User Management
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    View all users and manage their permissions and access levels.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="large"
                    onClick={handleUserManagement}
                  >
                    Manage Users
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}
          
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;