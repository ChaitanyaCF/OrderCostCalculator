import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import Header from '../layout/Header';

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

interface EnquiryItem {
  id: number;
  customerSkuReference?: string;
  productDescription: string;
  requestedQuantity: number;
  deliveryRequirement?: string;
  product?: string;
  trimType?: string;
  unitPrice?: number;
  totalPrice?: number;
  mappingConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'MANUAL_REVIEW';
  aiMapped: boolean;
}

interface Quote {
  id: number;
  quoteNumber: string;
  enquiryId: string;
  customer: Customer;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  totalAmount: number;
  currency: string;
  createdAt: string;
  sentAt?: string;
  expiresAt?: string;
  quoteItems: QuoteItem[];
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
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for different data types
  const [enquiries, setEnquiries] = useState<EmailEnquiry[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Implement API calls to load data
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalEnquiries: 15,
        pendingQuotes: 8,
        activeOrders: 12,
        totalCustomers: 25,
        recentActivity: [
          {
            id: 1,
            type: 'ENQUIRY',
            title: 'New enquiry from ABC Corp',
            description: 'Salmon fillet request - 500kg',
            timestamp: '2 hours ago',
            status: 'PROCESSING'
          },
          {
            id: 2,
            type: 'QUOTE',
            title: 'Quote QUO-2024-001 sent',
            description: 'Sent to customer@example.com',
            timestamp: '4 hours ago',
            status: 'SENT'
          },
          {
            id: 3,
            type: 'ORDER',
            title: 'Order ORD-2024-001 confirmed',
            description: 'Production started',
            timestamp: '1 day ago',
            status: 'IN_PRODUCTION'
          }
        ]
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
                  <Badge badgeContent={stats?.totalEnquiries} color="primary">
                    Email Enquiries
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats?.pendingQuotes} color="warning">
                    Quotes
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats?.activeOrders} color="success">
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
            {/* Enquiries Tab */}
            {activeTab === 0 && (
              <Box>
                <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                  <Typography variant="h6">Email Enquiries</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadDashboardData}
                  >
                    Refresh
                  </Button>
                </Box>
                
                <Typography color="textSecondary" gutterBottom>
                  Manage enquiries received via Outlook email integration with Zapier MCP
                </Typography>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  📨 Connect your Outlook email to automatically process enquiries via Zapier MCP.
                  New emails will be parsed by AI and converted to structured enquiries.
                </Alert>
              </Box>
            )}

            {/* Quotes Tab */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>Quotes Management</Typography>
                <Typography color="textSecondary" gutterBottom>
                  Generated quotes from processed enquiries
                </Typography>
                
                <Alert severity="success" sx={{ mt: 2 }}>
                  💼 Quotes are automatically generated from AI-processed enquiries and sent via email.
                  Track acceptance, rejection, and conversion to orders.
                </Alert>
              </Box>
            )}

            {/* Orders Tab */}
            {activeTab === 2 && (
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
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>Customer Management</Typography>
                <Typography color="textSecondary" gutterBottom>
                  Email-based customer profiles and communication history
                </Typography>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  👥 Customers are automatically created from email enquiries.
                  AI extracts contact information from email signatures and content.
                </Alert>
              </Box>
            )}

            {/* Recent Activity Tab */}
            {activeTab === 4 && (
              <Box>
                <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                
                {stats?.recentActivity && (
                  <List>
                    {stats.recentActivity.map((activity) => (
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
                                    {activity.timestamp}
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
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Quick Actions */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Quick Actions</Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button variant="outlined" startIcon={<EmailIcon />}>
                Test Email Processing
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" startIcon={<QuoteIcon />}>
                Manual Quote Creation
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" startIcon={<RefreshIcon />}>
                Sync with Zapier
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default EmailEnquiryDashboard; 