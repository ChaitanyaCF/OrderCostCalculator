import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Email as EmailIcon,
  Assignment as QuoteIcon,
  ShoppingCart as OrderIcon,
  Person as CustomerIcon,
  CheckCircle as AcceptedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import Header from '../layout/Header';
import EmailService, { Email, EmailStats } from '../../services/EmailService';
import EmailEnquiryService, { EnquiryItem } from '../../services/EmailEnquiryService';
import AuthService from '../../services/AuthService';
import { API_BASE_URL } from '../../config';

// Types for email-driven workflow
interface EmailEnquiry {
  id: number;
  enquiryId: string;
  fromEmail: string;
  subject: string;
  emailBody: string;
  status: 'RECEIVED' | 'PROCESSING' | 'QUOTED' | 'CONVERTED' | 'EXPIRED';
  receivedAt: string;
  processedAt?: string;
  customer: Customer;
  enquiryItems: EnquiryItem[];
  aiProcessed: boolean;
}

interface Customer {
  id: number;
  email: string;
  contactPerson?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  country?: string;
}

interface CustomerWithCounts extends Customer {
  createdAt: string;
  updatedAt: string;
  enquiryCount: number;
  quoteCount: number;
  orderCount: number;
}



interface Quote {
  id: number;
  quoteNumber: string;
  customer: {
    id: number;
    email: string;
    contactPerson?: string;
    companyName?: string;
  };
  enquiry: {
    id: number;
    enquiryId: string;
    subject: string;
    fromEmail: string;
  };
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  totalAmount: number;
  currency: string;
  createdAt: string;
  validityPeriod: string;
}

interface QuoteItem {
  id: number;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

interface Order {
  id: number;
  orderNumber: string;
  quoteNumber: string;
  customer: Customer;
  status: 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  currency: string;
  createdAt: string;
  confirmedAt?: string;
  expectedDelivery?: string;
  deliveredAt?: string;
}

// Dashboard statistics
interface DashboardStats {
  totalEnquiries: number;
  pendingQuotes: number;
  activeOrders: number;
  totalCustomers: number;
  recentActivity: ActivityItem[];
}

// Email types for manual classification

interface ActivityItem {
  id: number;
  type: 'ENQUIRY' | 'QUOTE' | 'ORDER';
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

const EmailEnquiryDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for different data types
  const [enquiries, setEnquiries] = useState<EmailEnquiry[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [recentActivityLoading, setRecentActivityLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  
  // Email management state
  const [emails, setEmails] = useState<Email[]>([]);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerWithCounts[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Dialog states
  const [selectedEnquiry, setSelectedEnquiry] = useState<EmailEnquiry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<EmailEnquiry | null>(null);
  const [quoteDetailsDialogOpen, setQuoteDetailsDialogOpen] = useState(false);
  const [selectedQuoteDetails, setSelectedQuoteDetails] = useState<any>(null);
  const [quoteDetailsLoading, setQuoteDetailsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Load emails immediately when component mounts
    loadEmails();
    // Load enquiries as well
    loadEnquiries();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load real data from APIs
      const [emailStatsResponse, dashboardStatsResponse] = await Promise.all([
        EmailService.getEmailStats(),
        EmailEnquiryService.getDashboardStats()
      ]);
      
      setEmailStats(emailStatsResponse);
      
      // Set stats with real numbers from API
      setStats({
        totalEnquiries: dashboardStatsResponse.totalEnquiries || 0,
        pendingQuotes: dashboardStatsResponse.pendingQuotes || 0,
        activeOrders: dashboardStatsResponse.activeOrders || 0,
        totalCustomers: dashboardStatsResponse.totalCustomers || 0,
        recentActivity: []
      });
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Load emails when switching to emails tab
    if (newValue === 0) {
      loadEmails();
    }
    // Load enquiries when switching to enquiries tab
    if (newValue === 1) {
      loadEnquiries();
    }
    // Load quotes when switching to quotes tab
    if (newValue === 2) {
      loadQuotes();
    }
    // Load customers when switching to customers tab
    if (newValue === 4) {
      loadCustomers();
    }
    // Load recent activity when switching to recent activity tab
    if (newValue === 5) {
      loadRecentActivity();
    }
  };

  // Load emails function
  const loadEmails = async () => {
    try {
      setEmailsLoading(true);
      const [emailsData, statsData] = await Promise.all([
        EmailService.getAllEmails(),
        EmailService.getEmailStats()
      ]);
      setEmails(emailsData);
      setEmailStats(statsData);
    } catch (error) {
      console.error('Failed to load emails:', error);
      setError('Failed to load emails');
    } finally {
      setEmailsLoading(false);
    }
  };

  // Load enquiries function
  const loadEnquiries = async () => {
    try {
      const enquiriesData = await EmailEnquiryService.getAllEnquiries();
      setEnquiries(enquiriesData);
    } catch (error) {
      console.error('Failed to load enquiries:', error);
      setError('Failed to load enquiries');
    }
  };

  // Load quotes function
  const loadQuotes = async () => {
    try {
      setQuotesLoading(true);
      const authHeaders = AuthService.getAuthHeader();
      
      const response = await fetch(`${API_BASE_URL}/api/quotes`, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          // Optionally redirect to login
          return;
        }
        throw new Error(`Failed to fetch quotes: ${response.status}`);
      }
      
      const quotesData = await response.json();
      setQuotes(quotesData);
    } catch (error) {
      console.error('Failed to load quotes:', error);
      setError('Failed to load quotes');
    } finally {
      setQuotesLoading(false);
    }
  };

  // Load customers function
  const loadCustomers = async () => {
    try {
      setCustomersLoading(true);
      const authHeaders = AuthService.getAuthHeader();
      
      const response = await fetch(`${API_BASE_URL}/api/email-enquiries/customers`, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          return;
        }
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }
      
      const customersData = await response.json();
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setError('Failed to load customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  // Load recent activity function
  const loadRecentActivity = async () => {
    try {
      setRecentActivityLoading(true);
      const authHeaders = AuthService.getAuthHeader();
      
      const response = await fetch(`${API_BASE_URL}/api/email-enquiries/recent-activity`, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          return;
        }
        throw new Error(`Failed to fetch recent activity: ${response.status}`);
      }
      
      const activityData = await response.json();
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      setError('Failed to load recent activity');
    } finally {
      setRecentActivityLoading(false);
    }
  };

  // Classify email function
  const handleClassifyEmail = async (emailId: number, classification: 'INITIAL_ENQUIRY' | 'ORDER' | 'GENERAL') => {
    try {
      await EmailService.classifyEmail(emailId, classification);
      // Reload emails after classification
      loadEmails();
    } catch (error) {
      console.error('Failed to classify email:', error);
      setError('Failed to classify email');
    }
  };

  // View enquiry details
  const handleViewDetails = (enquiry: EmailEnquiry) => {
    setSelectedEnquiry(enquiry);
    setDetailDialogOpen(true);
  };

  // Delete enquiry
  const handleDeleteEnquiry = (enquiry: EmailEnquiry) => {
    setEnquiryToDelete(enquiry);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDeleteEnquiry = async () => {
    if (!enquiryToDelete) return;

    try {
      // TODO: Implement delete API call
      await EmailEnquiryService.deleteEnquiry(enquiryToDelete.id);
      
      // Remove from local state
      setEnquiries(prev => prev.filter(e => e.id !== enquiryToDelete.id));
      
      // Close dialog
      setDeleteDialogOpen(false);
      setEnquiryToDelete(null);
      
      // Reload dashboard data
      loadDashboardData();
    } catch (error) {
      console.error('Failed to delete enquiry:', error);
      setError('Failed to delete enquiry');
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setEnquiryToDelete(null);
  };

  // View quote details
  const handleViewQuoteDetails = async (quoteId: number) => {
    try {
      setQuoteDetailsLoading(true);
      setQuoteDetailsDialogOpen(true);
      
      const authHeaders = AuthService.getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}/details`, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quote details: ${response.status}`);
      }
      
      const quoteDetails = await response.json();
      setSelectedQuoteDetails(quoteDetails);
    } catch (error) {
      console.error('Failed to load quote details:', error);
      setError('Failed to load quote details');
    } finally {
      setQuoteDetailsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'RECEIVED': 'info',
      'PROCESSING': 'warning',
      'QUOTED': 'primary',
      'CONVERTED': 'success',
      'EXPIRED': 'error',
      'DRAFT': 'default',
      'SENT': 'primary',
      'ACCEPTED': 'success',
      'REJECTED': 'error',
      'CONFIRMED': 'success',
      'IN_PRODUCTION': 'warning',
      'SHIPPED': 'info',
      'DELIVERED': 'success',
      'CANCELLED': 'error'
    };
    return statusColors[status] || 'default';
  };

  const getStatusIcon = (type: string, status: string) => {
    if (status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'DELIVERED') {
      return <AcceptedIcon color="success" />;
    }
    if (status === 'PROCESSING' || status === 'IN_PRODUCTION') {
      return <PendingIcon color="warning" />;
    }
    if (status === 'REJECTED' || status === 'CANCELLED' || status === 'EXPIRED') {
      return <RejectedIcon color="error" />;
    }
    
    switch (type) {
      case 'ENQUIRY': return <EmailIcon />;
      case 'QUOTE': return <QuoteIcon />;
      case 'ORDER': return <OrderIcon />;
      default: return <EmailIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header 
        title="Email-Driven Order Management" 
        showBackButton={true}
        backPath="/dashboard"
      />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Dashboard Statistics */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <EmailIcon color="primary" fontSize="large" />
                    <Box>
                      <Typography variant="h4">{stats.totalEnquiries}</Typography>
                      <Typography color="textSecondary">Total Enquiries</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <QuoteIcon color="warning" fontSize="large" />
                    <Box>
                      <Typography variant="h4">{stats.pendingQuotes}</Typography>
                      <Typography color="textSecondary">Pending Quotes</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <OrderIcon color="success" fontSize="large" />
                    <Box>
                      <Typography variant="h4">{stats.activeOrders}</Typography>
                      <Typography color="textSecondary">Active Orders</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CustomerIcon color="info" fontSize="large" />
                    <Box>
                      <Typography variant="h4">{stats.totalCustomers}</Typography>
                      <Typography color="textSecondary">Total Customers</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Main Content Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab 
                label={
                  <Badge badgeContent={emailStats?.needingClassification || 0} color="error">
                    Emails
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats?.totalEnquiries || 0} color="primary">
                    Email Enquiries
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats?.pendingQuotes || 0} color="warning">
                    Quotes
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats?.activeOrders || 0} color="success">
                    Orders
                  </Badge>
                } 
              />
              <Tab label="Customers" />
              <Tab label="Recent Activity" />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box p={3}>
            {/* Emails Tab - Raw emails that need classification */}
            {activeTab === 0 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">All Emails</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadEmails}
                  >
                    Refresh
                  </Button>
                </Box>
                
                <Typography color="textSecondary" gutterBottom sx={{ mb: 3 }}>
                  View and manually classify emails that need attention. Emails with failed AI classification can be manually marked as Enquiry or Order.
                </Typography>
                
                {/* Email Statistics Cards */}
                {emailStats && (
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', py: 2 }}>
                        <CardContent sx={{ pb: 2 }}>
                          <Typography variant="h4" color="primary" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {emailStats.totalEmails}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Emails
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', py: 2 }}>
                        <CardContent sx={{ pb: 2 }}>
                          <Typography variant="h4" color="error" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {emailStats.needingClassification}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Need Classification
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', py: 2 }}>
                        <CardContent sx={{ pb: 2 }}>
                          <Typography variant="h4" color="info.main" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {emailStats.enquiries}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Enquiries
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', py: 2 }}>
                        <CardContent sx={{ pb: 2 }}>
                          <Typography variant="h4" color="success.main" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {emailStats.orders}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Orders
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', py: 2 }}>
                        <CardContent sx={{ pb: 2 }}>
                          <Typography variant="h4" color="text.secondary" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {emailStats.general}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            General
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
                
                {emailsLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : emails.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No emails available for classification.
                </Alert>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {/* Email Table Header */}
                    <Box 
                      sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '2fr 3fr 1.5fr 2fr 1.2fr 1.2fr',
                        gap: 2,
                        p: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        mb: 2,
                        fontWeight: 'bold',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">From</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">Subject</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Current Classification</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Manual Classification</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Status</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Received</Typography>
                    </Box>
                    
                    {emails.map((email) => (
                      <Box 
                        key={email.id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 3fr 1.5fr 2fr 1.2fr 1.2fr',
                          gap: 2,
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          alignItems: 'center'
                        }}
                      >
                        {/* From */}
                        <Typography variant="body2" noWrap>
                          {email.fromEmail}
                        </Typography>
                        
                        {/* Subject */}
                        <Box>
                          <Typography variant="body2" fontWeight="medium" noWrap>
                            {email.subject}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {email.emailBody ? email.emailBody.substring(0, 80) + '...' : ''}
                          </Typography>
                        </Box>
                        
                        {/* AI Classification */}
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Chip 
                            label={
                              email.effectiveClassification === 'INITIAL_ENQUIRY' ? 'Enquiry' :
                              email.effectiveClassification === 'ORDER' ? 'Order' :
                              email.effectiveClassification === 'GENERAL' ? 'General' :
                              'Unclassified'
                            } 
                            color={
                              email.effectiveClassification === 'INITIAL_ENQUIRY' ? 'primary' :
                              email.effectiveClassification === 'ORDER' ? 'success' :
                              email.effectiveClassification === 'GENERAL' ? 'default' : 'warning'
                            }
                                  size="small"
                            variant={email.effectiveClassification ? 'filled' : 'outlined'}
                          />
                        </Box>
                        
                        {/* Manual Classification */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                          <Tooltip 
                            title={
                              email.effectiveClassification && email.effectiveClassification !== 'UNCLASSIFIED' 
                                ? `Currently classified as: ${email.effectiveClassification === 'INITIAL_ENQUIRY' ? 'Enquiry' : email.effectiveClassification}`
                                : "Select a classification for this email"
                            }
                          >
                            <FormControl size="small" sx={{ width: '90%', maxWidth: 160 }}>
                              <Select
                                value={email.manualClassification || ''}
                                onChange={(e) => {
                                  const newClassification = e.target.value as 'INITIAL_ENQUIRY' | 'ORDER' | 'GENERAL';
                                  // Prevent reclassifying to the same category
                                  if (newClassification !== email.effectiveClassification) {
                                    handleClassifyEmail(email.id, newClassification);
                                  }
                                }}
                                displayEmpty
                                sx={{ fontSize: '0.875rem' }}
                              >
                                <MenuItem value="">
                                  <em>Select...</em>
                                </MenuItem>
                                <MenuItem 
                                  value="INITIAL_ENQUIRY"
                                  disabled={email.effectiveClassification === 'INITIAL_ENQUIRY'}
                                >
                                  Enquiry {email.effectiveClassification === 'INITIAL_ENQUIRY' && '(Current)'}
                                </MenuItem>
                                <MenuItem 
                                  value="ORDER"
                                  disabled={email.effectiveClassification === 'ORDER'}
                                >
                                  Order {email.effectiveClassification === 'ORDER' && '(Current)'}
                                </MenuItem>
                                <MenuItem 
                                  value="GENERAL"
                                  disabled={email.effectiveClassification === 'GENERAL'}
                                >
                                  General {email.effectiveClassification === 'GENERAL' && '(Current)'}
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Tooltip>
                        </Box>
                        
                        {/* Status */}
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Chip 
                            label={email.processed ? 'Processed' : 'Pending'} 
                            color={email.processed ? 'success' : 'warning'} 
                            size="small"
                          />
                        </Box>
                        
                        {/* Received */}
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                          {new Date(email.receivedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Email Enquiries Tab */}
            {activeTab === 1 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Email Enquiries</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      loadDashboardData();
                      loadEnquiries();
                    }}
                  >
                    Refresh
                  </Button>
                </Box>
                
                <Typography color="textSecondary" gutterBottom>
                  Manage enquiries received via Outlook email integration with Zapier MCP
                </Typography>
                
                {loading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : enquiries.length > 0 ? (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Recent Enquiries
                    </Typography>
                    
                    {/* Table Header */}
                    <Box 
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 2fr 3fr 1fr 1.5fr 1fr 1fr',
                        gap: 2,
                        p: 2,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        fontWeight: 'bold',
                        mb: 1,
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">Enquiry ID</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">From</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">Subject</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Status</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Received</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Actions</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Delete</Typography>
                    </Box>
                    
                    {/* Table Rows */}
                          {enquiries.map((enquiry) => (
                      <Box 
                        key={enquiry.id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 2fr 3fr 1fr 1.5fr 1fr 1fr',
                          gap: 2,
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {enquiry.enquiryId}
                                </Typography>
                        <Typography variant="body2">
                          {enquiry.fromEmail}
                                  </Typography>
                                <Typography variant="body2">
                          {enquiry.subject}
                                </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Chip 
                                  label={enquiry.status} 
                                  color={getStatusColor(enquiry.status)}
                                  size="small"
                          />
                        </Box>
                                                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                          {new Date(enquiry.receivedAt).toLocaleDateString()}
                                </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button 
                                  size="small"
                            color="error" 
                            variant="contained"
                            startIcon={<VisibilityIcon />}
                            sx={{ minWidth: 'auto', px: 1 }}
                            onClick={() => handleViewDetails(enquiry)}
                                >
                                  View
                                </Button>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteEnquiry(enquiry)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    📨 No enquiries found. Connect your Outlook email to automatically process enquiries via Zapier MCP.
                    New emails will be parsed by AI and converted to structured enquiries.
                  </Alert>
                )}
              </Box>
            )}

            {/* Quotes Tab */}
            {activeTab === 2 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Quotes Management</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadQuotes}
                  >
                    Refresh
                  </Button>
                </Box>
                
                <Typography color="textSecondary" gutterBottom>
                  Generated quotes from processed enquiries
                </Typography>
                
                {quotesLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : quotes.length > 0 ? (
                  <Box sx={{ mt: 3 }}>
                    {/* Table Header */}
                    <Box 
                                              sx={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 2fr 2fr 1.5fr 1fr 1.5fr 1fr 1fr',
                        gap: 2,
                        p: 2,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        fontWeight: 'bold',
                        mb: 1,
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">Quote Number</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">Customer</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">Enquiry</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Amount</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Status</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Created</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Validity</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Actions</Typography>
                    </Box>
                    
                    {/* Table Rows */}
                          {quotes.map((quote) => (
                      <Box 
                        key={quote.id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 2fr 2fr 1.5fr 1fr 1.5fr 1fr 1fr',
                          gap: 2,
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                                  {quote.quoteNumber}
                                </Typography>
                                <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {quote.customer.contactPerson || quote.customer.email}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                            {quote.customer.companyName || 'No company'}
                                  </Typography>
                                </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {quote.enquiry.enquiryId}
                                </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>
                            {quote.enquiry.subject}
                                </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                          {quote.currency} {quote.totalAmount.toFixed(2)}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Chip 
                                  label={quote.status} 
                            color={getStatusColor(quote.status)} 
                                  size="small"
                          />
                        </Box>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                                  {new Date(quote.createdAt).toLocaleDateString()}
                                </Typography>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                          {quote.validityPeriod}
                                  </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button 
                                  size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewQuoteDetails(quote.id)}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            Details
                                </Button>
                    </Box>
                  </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    💼 No quotes found. Quotes are automatically generated from AI-processed enquiries.
                    Generate quotes from the Email Enquiries tab.
                  </Alert>
                )}
              </Box>
            )}

            {/* Orders Tab */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>Orders Management</Typography>
                <Typography color="textSecondary" gutterBottom>
                  Orders converted from accepted quotes
                </Typography>
                
                <Alert severity="warning" sx={{ mt: 2 }}>
                  🚚 Orders are created when customers accept quotes via email.
                  Track production status and delivery.
                </Alert>
              </Box>
            )}

            {/* Customers Tab */}
            {activeTab === 4 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Customer Management</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadCustomers}
                  >
                    Refresh
                  </Button>
                </Box>
                
                <Typography color="textSecondary" gutterBottom>
                  Email-based customer profiles and communication history
                </Typography>
                
                {customersLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : customers.length > 0 ? (
                  <Box sx={{ mt: 3 }}>
                    {/* Table Header */}
                    <Box 
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr 1fr 1.5fr',
                        gap: 2,
                        p: 2,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        fontWeight: 'bold',
                        mb: 1,
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">Email</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">Contact Person</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">Company</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Country</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Enquiries</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Quotes</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'center' }}>Created</Typography>
                    </Box>
                    
                    {/* Table Rows */}
                    {customers.map((customer) => (
                      <Box 
                        key={customer.id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr 1fr 1.5fr',
                          gap: 2,
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {customer.email}
                        </Typography>
                        <Typography variant="body2">
                          {customer.contactPerson || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          {customer.companyName || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                          {customer.country || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                          {customer.enquiryCount || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                          {customer.quoteCount || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                    👥 No customers found. Customers are automatically created from email enquiries.
                  AI extracts contact information from email signatures and content.
                </Alert>
                )}
              </Box>
            )}

            {/* Recent Activity Tab */}
            {activeTab === 5 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Recent Activity</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadRecentActivity}
                  >
                    Refresh
                  </Button>
                </Box>
                
                <Typography color="textSecondary" gutterBottom>
                  Recent activity from the last 30 days
                </Typography>
                
                {recentActivityLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <List>
                    {recentActivity.map((activity) => (
                      <React.Fragment key={activity.id}>
                        <ListItem>
                          <ListItemIcon>
                            {getStatusIcon(activity.type, activity.status)}
                          </ListItemIcon>
                          <ListItemText
                            primary={activity.title}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {activity.description}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={1}>
                                  <Chip 
                                    label={activity.status} 
                                    size="small"
                                    color={getStatusColor(activity.status)}
                                  />
                                  <Typography variant="caption" color="textSecondary">
                                    {new Date(activity.timestamp).toLocaleString()}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No recent activity available. Activity will appear here when emails are processed, quotes are generated, or orders are placed.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* View Details Dialog */}
      <Dialog 
        open={detailDialogOpen} 
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
        fullWidth
      >
        <DialogTitle>
            Email Enquiry Details
        </DialogTitle>
          <DialogContent>
          {selectedEnquiry && (
              <Box>
                  <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Enquiry ID</Typography>
                    <Typography variant="body1">{selectedEnquiry.enquiryId}</Typography>
                    </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                      <Chip 
                        label={selectedEnquiry.status} 
                        color={getStatusColor(selectedEnquiry.status)}
                      size="small" 
                      />
                    </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">From</Typography>
                    <Typography variant="body1">{selectedEnquiry.fromEmail}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Received</Typography>
                    <Typography variant="body1">{new Date(selectedEnquiry.receivedAt).toLocaleString()}</Typography>
                  </Grid>
                       <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Subject</Typography>
                    <Typography variant="body1">{selectedEnquiry.subject}</Typography>
                       </Grid>
                       <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Customer</Typography>
                    <Typography variant="body1">
                      {selectedEnquiry.customer?.contactPerson || 'N/A'} ({selectedEnquiry.customer?.companyName || 'Unknown Company'})
                             </Typography>
                       </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Email Body</Typography>
                    <Paper sx={{ p: 2, mt: 1, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                      <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedEnquiry.emailBody}
                  </Typography>
                  </Paper>
                </Grid>
                  {selectedEnquiry.enquiryItems && selectedEnquiry.enquiryItems.length > 0 && (
              <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>AI Parsed Fields</Typography>
                      <Paper sx={{ mt: 1, overflow: 'hidden' }}>
                        {/* Table Header */}
                        <Box 
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                            gap: 1,
                            p: 2,
                            bgcolor: 'grey.100',
                            fontWeight: 'bold'
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="bold">Product Description</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">Product Type</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">Product Cut</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">RM Spec</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">Pack Material</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">Box Qty</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">Quantity</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">Confidence</Typography>
                        </Box>
                        
                        {/* Table Rows */}
                        {selectedEnquiry.enquiryItems.map((item, index) => (
                          <Box 
                            key={index}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                              gap: 1,
                              p: 2,
                              bgcolor: index % 2 === 0 ? 'white' : 'grey.50',
                              alignItems: 'center',
                              borderTop: '1px solid',
                              borderColor: 'grey.200'
                            }}
                          >
                            <Typography variant="body2">
                              {item.productDescription || 'N/A'}
                              </Typography>
                            <Typography variant="body2">
                              {item.productType || 'N/A'}
                              </Typography>
                            <Typography variant="body2">
                              {item.product || 'N/A'}
                              </Typography>
                            <Typography variant="body2">
                              {item.rmSpec || 'N/A'}
                              </Typography>
                            <Typography variant="body2">
                              {item.packMaterial || 'N/A'}
                              </Typography>
                            <Typography variant="body2">
                              {item.boxQuantity || 'N/A'}
                              </Typography>
                        <Typography variant="body2">
                              {item.requestedQuantity} kg
                              </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Chip 
                                label={item.mappingConfidence} 
                                color={
                                  item.mappingConfidence === 'HIGH' ? 'success' : 
                                  item.mappingConfidence === 'MEDIUM' ? 'warning' : 'error'
                                }
                                size="small"
                              />
                  </Box>
                          </Box>
                        ))}
                </Paper>
              </Grid>
                      )}
                    </Grid>
              </Box>
          )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                // Navigate to quote generation
                navigate(`/quote-generation/${selectedEnquiry?.enquiryId}`);
              }}
            >
            Generate Quote
          </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={cancelDelete}
          aria-labelledby="delete-dialog-title"
        >
          <DialogTitle id="delete-dialog-title">
            Confirm Delete Enquiry
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the enquiry "{enquiryToDelete?.enquiryId}" from {enquiryToDelete?.fromEmail}?
              <br/><br/>
              <strong>This action cannot be undone.</strong>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete} color="primary">
              Cancel
            </Button>
            <Button onClick={confirmDeleteEnquiry} color="error" variant="contained">
              Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quote Details Dialog */}
      <Dialog 
        open={quoteDetailsDialogOpen} 
        onClose={() => setQuoteDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Quote Details {selectedQuoteDetails?.quoteNumber && `- ${selectedQuoteDetails.quoteNumber}`}
        </DialogTitle>
        <DialogContent>
          {quoteDetailsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : selectedQuoteDetails && (
            <Box>
              {/* Quote Header Info */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Quote Number</Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedQuoteDetails.quoteNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Chip 
                    label={selectedQuoteDetails.status} 
                    color={getStatusColor(selectedQuoteDetails.status)}
                    size="small" 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Customer</Typography>
                  <Typography variant="body1">
                    {selectedQuoteDetails.customer?.contactPerson || selectedQuoteDetails.customer?.email}
                    </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedQuoteDetails.customer?.companyName}
                        </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Total Amount</Typography>
                  <Typography variant="h6" color="primary">
                    {selectedQuoteDetails.currency} {selectedQuoteDetails.totalAmount?.toFixed(2)}
                          </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedQuoteDetails.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Validity</Typography>
                  <Typography variant="body1">{selectedQuoteDetails.validityPeriod}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Quote Items */}
              <Typography variant="h6" gutterBottom>Quote Items</Typography>
              {selectedQuoteDetails.items && selectedQuoteDetails.items.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {selectedQuoteDetails.items.map((item: any, index: number) => (
                    <Paper key={item.id || index} sx={{ p: 3, mb: 2, border: '1px solid', borderColor: 'grey.200' }}>
                      <Grid container spacing={2}>
                        {/* Item Description */}
              <Grid item xs={12}>
                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            {item.itemDescription || `Item ${index + 1}`}
                </Typography>
                        </Grid>

                        {/* Specifications */}
                        {item.specifications && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                              Product Specifications
                  </Typography>
                            <Grid container spacing={2}>
                              {item.specifications.product && (
                                <Grid item xs={6} sm={4}>
                                  <Typography variant="caption" color="textSecondary">Product</Typography>
                                  <Typography variant="body2">{item.specifications.product}</Typography>
              </Grid>
                              )}
                              {item.specifications.trimType && (
                                <Grid item xs={6} sm={4}>
                                  <Typography variant="caption" color="textSecondary">Trim Type</Typography>
                                  <Typography variant="body2">{item.specifications.trimType}</Typography>
                                </Grid>
                              )}
                              {item.specifications.rmSpec && (
                                <Grid item xs={6} sm={4}>
                                  <Typography variant="caption" color="textSecondary">RM Specification</Typography>
                                  <Typography variant="body2">{item.specifications.rmSpec}</Typography>
                                </Grid>
                              )}
                              {item.specifications.packagingType && (
                                <Grid item xs={6} sm={4}>
                                  <Typography variant="caption" color="textSecondary">Packaging</Typography>
                                  <Typography variant="body2">{item.specifications.packagingType}</Typography>
                                </Grid>
                              )}
                              {item.specifications.boxQuantity && (
                                <Grid item xs={6} sm={4}>
                                  <Typography variant="caption" color="textSecondary">Box Quantity</Typography>
                                  <Typography variant="body2">{item.specifications.boxQuantity}</Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Grid>
                        )}

                        {/* Pricing Information */}
              <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Pricing Details
                </Typography>
                  <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="textSecondary">Quantity</Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {item.quantity} kg
                      </Typography>
                    </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="textSecondary">Unit Price</Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {item.currency} {item.unitPrice?.toFixed(2)}
                              </Typography>
                    </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="textSecondary">Cost per kg</Typography>
                              <Typography variant="body1" fontWeight="medium" color="primary">
                                {item.currency} {item.costPerKg?.toFixed(2)}/kg
                          </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="textSecondary">Total Cost</Typography>
                              <Typography variant="h6" color="primary">
                                {item.currency} {item.totalPrice?.toFixed(2)}
                        </Typography>
                    </Grid>
                  </Grid>
              </Grid>

                        {/* Notes */}
                        {item.notes && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
                            <Typography variant="body2">{item.notes}</Typography>
            </Grid>
                        )}
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No items found for this quote.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuoteDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      </Container>
    </Box>
  );
};

export default EmailEnquiryDashboard; 