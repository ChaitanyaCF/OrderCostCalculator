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
import QuoteGeneration from './components/enquiry/QuoteGeneration';
import Quotes from './components/quotes/Quotes';
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
  "Real-time rate management",
  "Multi-currency support",
  "Export capabilities for quotes and reports"
];

function App() {
  const [tabValue, setTabValue] = useState(0);

  const AuthPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    };

    return (
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* Left Panel - Login/Register */}
        <Grid item xs={12} md={6} sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: { xs: 2, md: 4 }
        }}>
          <Paper 
            elevation={3} 
            sx={{ 
              padding: { xs: 3, md: 6 }, 
              maxWidth: 500, 
              width: '100%',
              borderRadius: 2
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="fullWidth"
                sx={{ '& .MuiTab-root': { textTransform: 'none' } }}
              >
                <Tab label="Login" />
                <Tab label="Register" />
              </Tabs>
            </Box>
            
            {tabValue === 0 ? <Login /> : <Register />}
          </Paper>
        </Grid>

        {/* Right Panel - Product Information */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: { xs: 4, md: 6 },
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background pattern */}
          <Box 
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3Ccircle cx="53" cy="7" r="7"/%3E%3Ccircle cx="7" cy="53" r="7"/%3E%3Ccircle cx="53" cy="53" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold',
                mb: 3,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              ProCost Calculator
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 4, 
                opacity: 0.9,
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}
            >
              Professional seafood processing cost calculation and enquiry management system
            </Typography>

            <Box component="ul" sx={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              '& li': {
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                fontSize: { xs: '0.95rem', md: '1rem' }
              },
              '& li::before': {
                content: '"✓"',
                color: 'secondary.main',
                fontWeight: 'bold',
                mr: 2,
                fontSize: '1.2em'
              }
            }}>
              {features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </Box>

            <Typography 
              variant="body2" 
              sx={{ 
                mt: 4, 
                opacity: 0.8,
                fontStyle: 'italic',
                fontSize: { xs: '0.85rem', md: '0.95rem' }
              }}
            >
              Streamline your seafood processing operations with accurate cost calculations and efficient enquiry management.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  };

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
            <Route path="/quote-generation/:enquiryId" element={
              <ProtectedRoute>
                <FactoryProvider>
                  <QuoteGeneration />
                </FactoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/quotes" element={
              <ProtectedRoute>
                <Quotes />
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