import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Typography, 
  Tabs, 
  Tab, 
  ThemeProvider, 
  CssBaseline,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import NewEnquiry from './components/enquiry/NewEnquiry';
import FactoryRateCard from './components/ratecard/FactoryRateCard';
import UserManagement from './components/user/UserManagement';
import EmailEnquiryDashboard from './components/email-management/EmailEnquiryDashboard';
import TestUploader from './components/ratecard/TestUploader';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import { FactoryProvider } from './context/FactoryContext';
import { AuthProvider } from './context/AuthContext';
import theme from './theme';
import './App.css';
import './services/axios-interceptor'; // Import the axios interceptor

// Features list for the product
const features = [
  "Accurate cost calculation based on product specifications",
  "Streamlined enquiry processing workflow",
  "Email-driven order management with Zapier MCP integration",
  "AI-powered email parsing and product mapping",
  "Automated quote generation and order conversion",
  "Customer management and communication tracking",
];

function App() {
  const [tabValue, setTabValue] = useState(0);
  const appTheme = useTheme();
  const isMobile = useMediaQuery(appTheme.breakpoints.down('md'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const AuthPage = () => (
    <Grid container sx={{ height: '100vh' }}>
      {/* Left side - Logo and product info */}
      {!isMobile && (
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{ 
            bgcolor: 'primary.main', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            color: 'white'
          }}
        >
          <Box className="logo-container">
            <Box 
              component="img" 
              src="/images/cft-logo.png" 
              alt="ProCost Logo"
              className="logo-animation"
              sx={{ 
                width: '240px'
              }}
            />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom textAlign="center">
            ProCost Enquiry Calculator
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mb: 4 }} textAlign="center">
            Simplify your product cost calculation process
          </Typography>
          
          <Box sx={{ width: '100%', maxWidth: '500px' }}>
            {features.map((feature, index) => (
              <Box 
                key={index}
                className="feature-animation" 
                sx={{ 
      display: 'flex',
      alignItems: 'center',
                  mb: 2,
                  style: { animationDelay: `${0.3 + index * 0.1}s` }
                }}
              >
                <Box 
                  sx={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    bgcolor: 'white',
                    mr: 2 
                  }} 
                />
                <Typography>{feature}</Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      )}
      
      {/* Right side - Auth forms */}
      <Grid 
        item 
        xs={12} 
        md={6} 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          p: 4
        }}
      >
        {isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Box className="logo-container">
              <Box 
                component="img" 
                src="/images/cft-logo.png" 
                alt="ProCost Logo"
                sx={{ 
                  width: '160px'
                }}
              />
            </Box>
          </Box>
        )}
        
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            maxWidth: '500px',
            width: '100%',
            mx: 'auto'
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom textAlign="center" color="primary">
            {isMobile ? "ProCost Enquiry Calculator" : "Welcome Back"}
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              centered 
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>
          </Box>
          
          {tabValue === 0 && <Login />}
          {tabValue === 1 && <Register />}
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/new-enquiry" element={
              <ProtectedRoute>
                <FactoryProvider>
                  <NewEnquiry />
                </FactoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/factory-rate-card" element={
              <AdminProtectedRoute>
                <FactoryProvider>
                  <FactoryRateCard />
                </FactoryProvider>
              </AdminProtectedRoute>
            } />
            <Route path="/user-management" element={
              <AdminProtectedRoute>
                <UserManagement />
              </AdminProtectedRoute>
            } />
            <Route path="/email-enquiry-dashboard" element={
              <AdminProtectedRoute>
                <EmailEnquiryDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/test-uploader" element={<TestUploader />} />
            <Route path="/history" element={
              <ProtectedRoute>
                <div>Enquiry History (Under Construction)</div>
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute>
                <div>Account Settings (Under Construction)</div>
              </ProtectedRoute>
            } />
            <Route path="/" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;