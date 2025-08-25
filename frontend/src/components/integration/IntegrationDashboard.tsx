import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tab,
  Tabs,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as ActivateIcon,
  Pause as DeactivateIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Assessment as StatsIcon,
  Cable as ConnectIcon,
  AutoAwesome as AIIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { FieldMappingCanvas } from './FieldMappingCanvas';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import AuthService from '../../services/AuthService';

// Types
interface Integration {
  id: number;
  name: string;
  description: string;
  type: 'WEBHOOK_PUSH' | 'API_PULL' | 'BIDIRECTIONAL';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'TESTING';
  externalSystemName: string;
  externalApiUrl: string;
  authType: 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH2' | 'NONE';
  supportedEntities: string;
  lastSyncAt?: string;
  createdAt: string;
  createdBy: string;
}

interface IntegrationStats {
  id: number;
  name: string;
  status: string;
  type: string;
  lastSync?: string;
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  recentActivity: number;
}

interface DashboardData {
  totalIntegrations: number;
  activeIntegrations: number;
  inactiveIntegrations: number;
  errorIntegrations: number;
  recentlyActive: number;
  integrationsByType: Record<string, number>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const IntegrationDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [mappingDialog, setMappingDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'WEBHOOK_PUSH' as Integration['type'],
    externalSystemName: '',
    externalApiUrl: '',
    apiKey: '',
    webhookUrl: '',
    authType: 'API_KEY' as Integration['authType'],
    supportedEntities: '["ENQUIRY"]'
  });

  // Field mapping states
  const [sourceFields, setSourceFields] = useState<any[]>([]);
  const [targetFields, setTargetFields] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [fieldDiscoveryLoading, setFieldDiscoveryLoading] = useState(false);

  useEffect(() => {
    loadIntegrations();
    loadDashboardData();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/integrations`, {
        headers: AuthService.getAuthHeader()
      });
      // Ensure response.data is an array
      const integrationData = Array.isArray(response.data) ? response.data : [];
      setIntegrations(integrationData);
    } catch (err: any) {
      setError('Failed to load integrations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/integrations/dashboard`, {
        headers: AuthService.getAuthHeader()
      });
      setDashboardData(response.data);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleCreateIntegration = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/integrations`, formData, {
        headers: AuthService.getAuthHeader()
      });
      setCreateDialog(false);
      resetForm();
      loadIntegrations();
      loadDashboardData();
    } catch (err: any) {
      setError('Failed to create integration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIntegration = async () => {
    if (!selectedIntegration) return;
    
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/integrations/${selectedIntegration.id}`, formData, {
        headers: AuthService.getAuthHeader()
      });
      setEditDialog(false);
      setSelectedIntegration(null);
      resetForm();
      loadIntegrations();
    } catch (err: any) {
      setError('Failed to update integration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntegration = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/api/integrations/${id}`, {
        headers: AuthService.getAuthHeader()
      });
      loadIntegrations();
      loadDashboardData();
    } catch (err: any) {
      setError('Failed to delete integration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (integration: Integration) => {
    const newStatus = integration.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const endpoint = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
    
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/integrations/${integration.id}/${endpoint}`, {}, {
        headers: AuthService.getAuthHeader()
      });
      loadIntegrations();
      loadDashboardData();
    } catch (err: any) {
      setError(`Failed to ${endpoint} integration: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (integration: Integration) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/integrations/${integration.id}/test`, {}, {
        headers: AuthService.getAuthHeader()
      });
      
      if (response.data.success) {
        alert(`Connection successful! Response time: ${response.data.responseTime}ms`);
      } else {
        alert(`Connection failed: ${response.data.message}`);
      }
    } catch (err: any) {
      alert('Connection test failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverFields = async (integration: Integration, entityType: string) => {
    try {
      setFieldDiscoveryLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/integrations/${integration.id}/discover-fields?entityType=${entityType}`,
        {},
        { headers: AuthService.getAuthHeader() }
      );
      
      setSourceFields(response.data.sourceFields || []);
      setTargetFields(response.data.targetFields || []);
      setSuggestions(response.data.aiSuggestions || []);
      setMappings([]); // Reset mappings for new discovery
    } catch (err: any) {
      setError('Failed to discover fields: ' + err.message);
    } finally {
      setFieldDiscoveryLoading(false);
    }
  };

  const handleOpenFieldMapping = (integration: Integration) => {
    setSelectedIntegration(integration);
    setMappingDialog(true);
    // Auto-discover fields for ENQUIRY by default
    handleDiscoverFields(integration, 'ENQUIRY');
  };

  const handleMappingCreate = (sourceField: string, targetField: string) => {
    const newMapping = {
      id: Date.now().toString(),
      sourceField,
      targetField,
      transformationRule: '',
      isActive: true,
      confidenceScore: 0.8,
      mappingType: 'DIRECT' as const
    };
    setMappings([...mappings, newMapping]);
  };

  const handleMappingUpdate = (mapping: any) => {
    setMappings(mappings.map(m => m.id === mapping.id ? mapping : m));
  };

  const handleMappingDelete = (mappingId: string) => {
    setMappings(mappings.filter(m => m.id !== mappingId));
  };

  const handleTransformationEdit = (mappingId: string, transformation: string) => {
    setMappings(mappings.map(m => 
      m.id === mappingId 
        ? { ...m, transformationRule: transformation, mappingType: transformation ? 'TRANSFORMED' : 'DIRECT' }
        : m
    ));
  };

  const handleSuggestTransformation = async (sourceValue: any, targetType: string, context: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/integrations/suggest-transformation`,
        { sourceValue, targetType, context },
        { headers: AuthService.getAuthHeader() }
      );
      return response.data;
    } catch (err: any) {
      throw new Error('Failed to get transformation suggestion: ' + err.message);
    }
  };

  const handleSaveMappings = async () => {
    if (!selectedIntegration) return;
    
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/integrations/${selectedIntegration.id}/mappings`,
        mappings,
        { headers: AuthService.getAuthHeader() }
      );
      setMappingDialog(false);
      alert('Field mappings saved successfully!');
    } catch (err: any) {
      setError('Failed to save mappings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'WEBHOOK_PUSH',
      externalSystemName: '',
      externalApiUrl: '',
      apiKey: '',
      webhookUrl: '',
      authType: 'API_KEY',
      supportedEntities: '["ENQUIRY"]'
    });
  };

  const openEditDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setFormData({
      name: integration.name,
      description: integration.description,
      type: integration.type,
      externalSystemName: integration.externalSystemName,
      externalApiUrl: integration.externalApiUrl,
      apiKey: '', // Don't pre-fill sensitive data
      webhookUrl: '',
      authType: integration.authType,
      supportedEntities: integration.supportedEntities
    });
    setEditDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'ERROR': return 'error';
      case 'TESTING': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <SuccessIcon />;
      case 'ERROR': return <ErrorIcon />;
      case 'TESTING': return <WarningIcon />;
      default: return undefined;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4" component="h1">
            Integration Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialog(true)}
          >
            New Integration
          </Button>
        </Box>
        
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Integrations" />
          <Tab label="Logs & Monitoring" />
        </Tabs>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        {/* Overview Dashboard */}
        <Grid container spacing={3}>
          {dashboardData && (
            <>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Integrations
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData.totalIntegrations}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Active
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {dashboardData.activeIntegrations}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Inactive
                    </Typography>
                    <Typography variant="h4" color="text.secondary">
                      {dashboardData.inactiveIntegrations}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Errors
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {dashboardData.errorIntegrations}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Integration monitoring and activity logs will be displayed here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Integrations List */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>External System</TableCell>
                <TableCell>Last Sync</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(integrations || []).map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {integration.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {integration.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={integration.type} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(integration.status)}
                      label={integration.status}
                      size="small"
                      color={getStatusColor(integration.status) as any}
                    />
                  </TableCell>
                  <TableCell>{integration.externalSystemName}</TableCell>
                  <TableCell>
                    {integration.lastSyncAt 
                      ? new Date(integration.lastSyncAt).toLocaleString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Test Connection">
                        <IconButton 
                          size="small" 
                          onClick={() => handleTestConnection(integration)}
                        >
                          <ConnectIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Field Mapping">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenFieldMapping(integration)}
                        >
                          <AIIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={integration.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleToggleStatus(integration)}
                          color={integration.status === 'ACTIVE' ? 'error' : 'success'}
                        >
                          {integration.status === 'ACTIVE' ? 
                            <DeactivateIcon fontSize="small" /> : 
                            <ActivateIcon fontSize="small" />
                          }
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(integration)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteIntegration(integration.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Logs & Monitoring */}
        <Typography variant="h6" gutterBottom>
          Integration Logs & Monitoring
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed logs and monitoring dashboard will be implemented here.
        </Typography>
      </TabPanel>

      {/* Create Integration Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Integration</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Integration Name"
                  variant="outlined"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel>Integration Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    label="Integration Type"
                  >
                    <MenuItem value="WEBHOOK_PUSH">Webhook Push</MenuItem>
                    <MenuItem value="API_PULL">API Pull</MenuItem>
                    <MenuItem value="BIDIRECTIONAL">Bidirectional</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  variant="outlined"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the purpose and functionality of this integration..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="External System Name"
                  variant="outlined"
                  value={formData.externalSystemName}
                  onChange={(e) => setFormData({...formData, externalSystemName: e.target.value})}
                  placeholder="e.g., SAP, Oracle ERP, Salesforce"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="External API URL"
                  variant="outlined"
                  value={formData.externalApiUrl}
                  onChange={(e) => setFormData({...formData, externalApiUrl: e.target.value})}
                  placeholder="https://api.example.com/webhook"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel>Authentication Type</InputLabel>
                  <Select
                    value={formData.authType}
                    onChange={(e) => setFormData({...formData, authType: e.target.value as any})}
                    label="Authentication Type"
                  >
                    <MenuItem value="API_KEY">API Key</MenuItem>
                    <MenuItem value="BEARER_TOKEN">Bearer Token</MenuItem>
                    <MenuItem value="BASIC_AUTH">Basic Auth</MenuItem>
                    <MenuItem value="OAUTH2">OAuth2</MenuItem>
                    <MenuItem value="NONE">None</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="API Key / Token"
                  variant="outlined"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  placeholder="Enter your API key or token"
                  helperText="This will be encrypted and stored securely"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setCreateDialog(false)}
            color="inherit"
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateIntegration} 
            variant="contained"
            color="primary"
            size="large"
            disabled={!formData.name || !formData.externalSystemName || !formData.externalApiUrl}
          >
            Create Integration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Integration Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Integration</DialogTitle>
        <DialogContent>
          {/* Similar form fields as create dialog */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Integration Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Integration Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                  <MenuItem value="WEBHOOK_PUSH">Webhook Push</MenuItem>
                  <MenuItem value="API_PULL">API Pull</MenuItem>
                  <MenuItem value="BIDIRECTIONAL">Bidirectional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateIntegration} variant="contained">
            Update Integration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Field Mapping Dialog */}
      <Dialog 
        open={mappingDialog} 
        onClose={() => setMappingDialog(false)} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          Field Mapping - {selectedIntegration?.name}
          <Typography variant="body2" color="text.secondary">
            Drag and drop fields to create mappings, or use AI suggestions
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1 }}>
          <FieldMappingCanvas
            sourceFields={sourceFields}
            targetFields={targetFields}
            mappings={mappings}
            suggestions={suggestions}
            onMappingCreate={handleMappingCreate}
            onMappingUpdate={handleMappingUpdate}
            onMappingDelete={handleMappingDelete}
            onTransformationEdit={handleTransformationEdit}
            onSuggestTransformation={handleSuggestTransformation}
            loading={fieldDiscoveryLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMappingDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => selectedIntegration && handleDiscoverFields(selectedIntegration, 'ENQUIRY')}
            startIcon={<AIIcon />}
            disabled={fieldDiscoveryLoading}
          >
            Rediscover Fields
          </Button>
          <Button 
            onClick={handleSaveMappings} 
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={mappings.length === 0}
          >
            Save Mappings ({mappings.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationDashboard;
