import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Input,
  Tooltip,
  Menu,
  Divider,
  TablePagination,
  InputAdornment,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFactory, Factory } from '../../context/FactoryContext';
import * as csvLoader from '../../utils/csvLoader';
import { PACKAGING_CSV_TEMPLATE, RATE_CSV_TEMPLATE, downloadTemplate } from '../../utils/csvTemplates';
import * as factoryService from '../../services/FactoryService';
import AuthService from '../../services/AuthService';
import Header from '../layout/Header';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rate-card-tabpanel-${index}`}
      aria-labelledby={`rate-card-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const FactoryRateCard: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    factories, 
    selectedFactory, 
    setSelectedFactory, 
    addFactory, 
    updateFactoryData: contextUpdateFactoryData,
    loadFactoryData: contextLoadFactoryData,
    loading: factoryLoading,
    error: factoryError
  } = useFactory();
  const navigate = useNavigate();
  
  // Refs for file inputs
  const packagingFileInputRef = useRef<HTMLInputElement>(null);
  const rateFileInputRef = useRef<HTMLInputElement>(null);
  
  // State variables
  const [tabValue, setTabValue] = useState(0);
  const [packagingData, setPackagingData] = useState<csvLoader.PackageOption[]>([]);
  const [rateData, setRateData] = useState<csvLoader.RateOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataChanged, setDataChanged] = useState<boolean>(false);
  const [initialData, setInitialData] = useState({ rateData: [], packagingData: [] });
  
  // Edit dialogs
  const [packagingDialogOpen, setPackagingDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [newFactoryDialogOpen, setNewFactoryDialogOpen] = useState(false);
  const [currentPackagingItem, setCurrentPackagingItem] = useState<csvLoader.PackageOption | null>(null);
  const [currentRateItem, setCurrentRateItem] = useState<csvLoader.RateOption | null>(null);
  const [newFactory, setNewFactory] = useState<{name: string, location: string}>({name: '', location: ''});
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{
    table: 'packaging' | 'rate',
    id: string, 
    field: string, 
    value: string | number
  } | null>(null);
  
  // Template help dialog
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [helpDialogType, setHelpDialogType] = useState<'packaging' | 'rate'>('packaging');
  
  // For auth refreshing
  const [authRetryCount, setAuthRetryCount] = useState(0);
  
  // Add pagination state variables
  const [packagingPage, setPackagingPage] = useState(0);
  const [packagingRowsPerPage, setPackagingRowsPerPage] = useState(10);
  const [ratePage, setRatePage] = useState(0);
  const [rateRowsPerPage, setRateRowsPerPage] = useState(10);
  
  // Factory settings
  const [palletCharge, setPalletCharge] = useState<number>(0);
  const [terminalCharge, setTerminalCharge] = useState<number>(0);
  const [factorySettingsChanged, setFactorySettingsChanged] = useState(false);
  
  // Function to load data for a factory
  const loadFactoryData = async (factory: Factory) => {
    if (!factory) {
      console.error("Cannot load data: No factory provided");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Loading data for factory:", factory.id, factory.name);
      
      // Check authentication status
      const user = AuthService.getCurrentUser();
      if (!user || !user.token) {
        console.error("No auth token available, cannot load data");
        setError("Your session has expired. Please log in again.");
        setLoading(false);
        logout();
        navigate('/login');
        return;
      }
      
      console.log("Authenticated as:", user.username);
      
      // Try to load from backend first
      console.log("Attempting to load data from backend API for factory ID:", factory.id);
      
      // Use try-catch for each API call to handle errors individually
      let packData: csvLoader.PackageOption[] = [];
      try {
        packData = await factoryService.getPackagingRates(factory.id);
        console.log("Successfully loaded packaging data:", packData.length, "items");
        console.log("PACKAGING DATA DETAIL:", {
          count: packData.length,
          allKeys: Object.keys(packData),
          isArray: Array.isArray(packData),
          firstItem: packData[0] ? JSON.stringify(packData[0]) : 'none',
          lastItem: packData.length > 1 ? JSON.stringify(packData[packData.length - 1]) : 'none',
          // Show all items if less than 50
          allItems: packData.length < 50 ? JSON.stringify(packData) : 'too many to display'
        });
      } catch (err: any) {
        console.error("Error loading packaging data:", err);
        if (err.response?.status === 401) {
          setError("Authentication error. Please log in again.");
          logout();
          navigate('/login');
          return;
        }
        setError(`Failed to load packaging data: ${err.message}`);
      }
      
      let rateData: csvLoader.RateOption[] = [];
      try {
        rateData = await factoryService.getRateTables(factory.id);
        console.log("Successfully loaded rate data:", rateData.length, "items");
        console.log("RATE DATA DETAIL:", {
          count: rateData.length,
          allKeys: Object.keys(rateData),
          isArray: Array.isArray(rateData),
          firstItem: rateData[0] ? JSON.stringify(rateData[0]) : 'none',
          lastItem: rateData.length > 1 ? JSON.stringify(rateData[rateData.length - 1]) : 'none',
          // Show all items if less than 50
          allItems: rateData.length < 50 ? JSON.stringify(rateData) : 'too many to display'
        });
      } catch (err: any) {
        console.error("Error loading rate data:", err);
        if (err.response?.status === 401) {
          setError("Authentication error. Please log in again.");
          logout();
          navigate('/login');
          return;
        }
        setError(`Failed to load rate data: ${err.message}`);
      }
      
      // Log data details for debugging
      console.log("Packaging data summary:", {
        count: packData.length,
        firstItem: packData[0] || 'none',
        lastItem: packData[packData.length - 1] || 'none'
      });
      
      console.log("Rate data summary:", {
        count: rateData.length,
        firstItem: rateData[0] || 'none',
        lastItem: rateData[rateData.length - 1] || 'none'
      });
      
      // Reset pagination when new data is loaded
      setPackagingPage(0);
      setRatePage(0);
      
      // Always update the state, even if arrays are empty
      setPackagingData(Array.isArray(packData) ? packData : []);
      setRateData(Array.isArray(rateData) ? rateData : []);
      setDataChanged(false);
      
    } catch (err: any) {
      console.error("Error loading data from backend:", err);
      if (err.response?.status === 401 && authRetryCount < 2) {
        // Try refreshing token logic would go here if implemented
        setAuthRetryCount(authRetryCount + 1);
        setError("Session may have expired. Trying to reconnect...");
        setTimeout(() => loadFactoryData(factory), 1000); // Retry after a delay
      } else {
        setError("Failed to load factory data. Please try logging in again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load initial data when component mounts
  useEffect(() => {
    // Verify authentication first
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      console.warn("No authentication token found, redirecting to login");
      logout();
      navigate('/login');
      return;
    }
    
    // If factories are available and no factory is selected, select the first one
    if (factories && factories.length > 0 && !selectedFactory) {
      console.log("Setting initial factory to:", factories[0].name);
      setSelectedFactory(factories[0]);
    }
  }, [factories, selectedFactory, setSelectedFactory, logout, navigate]);
  
  // Load data whenever selected factory changes
  useEffect(() => {
    if (selectedFactory) {
      console.log("Selected factory changed to:", selectedFactory.name);
      
      // Reset pagination to first page when factory changes
      setPackagingPage(0);
      setRatePage(0);
      
      // Check if the selectedFactory already has data in its object
      // If it does, and it's an empty array (not undefined), we should respect that
      const hasEmptyPackagingData = Array.isArray(selectedFactory.packagingData) && selectedFactory.packagingData.length === 0;
      const hasEmptyRateData = Array.isArray(selectedFactory.rateData) && selectedFactory.rateData.length === 0;
      
      if (hasEmptyPackagingData || hasEmptyRateData) {
        console.log("Factory has intentionally empty data arrays - not reloading from server");
        if (hasEmptyPackagingData) {
          console.log("Using empty packaging data from factory context");
          setPackagingData([]);
        }
        if (hasEmptyRateData) {
          console.log("Using empty rate data from factory context");
          setRateData([]);
        }
        
        // Only load data that isn't explicitly set to empty
        if (!hasEmptyPackagingData || !hasEmptyRateData) {
          console.log("Loading only non-empty data fields from server");
          loadFactoryData(selectedFactory);
        }
      } else {
        // Normal case - load data from server
        console.log("Loading all factory data from server");
        loadFactoryData(selectedFactory);
      }
    }
  }, [selectedFactory, authRetryCount]);
  
  // Pagination helpers to debug
  useEffect(() => {
    if (packagingData.length > 0) {
      console.log(`Pagination: Displaying packaging data page ${packagingPage + 1} of ${Math.ceil(packagingData.length / packagingRowsPerPage)}`);
      console.log(`Showing rows ${packagingPage * packagingRowsPerPage + 1} to ${Math.min((packagingPage + 1) * packagingRowsPerPage, packagingData.length)} of ${packagingData.length}`);
      
      // Calculate slice indices
      const start = packagingPage * packagingRowsPerPage;
      const end = start + packagingRowsPerPage;
      const displayedItems = packagingData.slice(start, end);
      console.log(`Packaging data slice [${start}:${end}] contains ${displayedItems.length} items`);
    }
  }, [packagingData, packagingPage, packagingRowsPerPage]);

  useEffect(() => {
    if (rateData.length > 0) {
      console.log(`Pagination: Displaying rate data page ${ratePage + 1} of ${Math.ceil(rateData.length / rateRowsPerPage)}`);
      console.log(`Showing rows ${ratePage * rateRowsPerPage + 1} to ${Math.min((ratePage + 1) * rateRowsPerPage, rateData.length)} of ${rateData.length}`);
      
      // Calculate slice indices
      const start = ratePage * rateRowsPerPage;
      const end = start + rateRowsPerPage;
      const displayedItems = rateData.slice(start, end);
      console.log(`Rate data slice [${start}:${end}] contains ${displayedItems.length} items`);
    }
  }, [rateData, ratePage, rateRowsPerPage]);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleFactoryChange = (event: any) => {
    const factoryId = event.target.value;
    const factory = factories.find(f => f.id === factoryId) || null;
    console.log("Factory changed to:", factory?.name || "None");
    setSelectedFactory(factory);
    // Data loading will be triggered by the useEffect that watches selectedFactory
  };
  
  // New Factory handlers
  const handleAddNewFactory = () => {
    setNewFactoryDialogOpen(true);
  };
  
  const handleNewFactoryDialogClose = () => {
    setNewFactoryDialogOpen(false);
    setNewFactory({name: '', location: ''});
  };
  
  const handleNewFactoryDialogSave = async () => {
    if (!newFactory.name || !newFactory.location) {
      setError('Factory name and location are required');
      return;
    }
    
 // Create new factory through context
 try {
  setLoading(true);
  console.log('Creating new factory:', newFactory);
  
  const newFactoryObj = await addFactory(newFactory.name, newFactory.location);
  console.log('New factory created successfully:', newFactoryObj);
  
  // Select the new factory
  setSelectedFactory(newFactoryObj);
  console.log('Selected new factory:', newFactoryObj);
  
  // Initialize empty data for the new factory to ensure it has proper data structure
  if (newFactoryObj) {
    // Initialize empty data arrays
    newFactoryObj.packagingData = [];
    newFactoryObj.rateData = [];
    
    // Update the local data state
    setPackagingData([]);
    setRateData([]);
    setDataChanged(false);
    
    console.log('Initialized empty data for new factory');
    
    // Save the empty data structure to the backend
    await contextUpdateFactoryData(
      newFactoryObj.id,
      [], // Empty packaging data
      [] // Empty rate data
    );
  }
  
  // Close dialog
  setNewFactoryDialogOpen(false);
  setNewFactory({name: '', location: ''});
  
  // Success message
  setError('New factory added successfully!');
  setTimeout(() => setError(null), 3000);
} catch (err) {
  console.error('Error adding factory:', err);
  setError('Failed to add new factory. Please try again.');
} finally {
  setLoading(false);
}
};
  // Packaging table handlers
  const handleAddPackaging = () => {
    setCurrentPackagingItem({
      prod_type: '',
      product: '',
      box_qty: '',
      pack: '',
      transport_mode: '',
      packaging_rate: 0
    });
    setPackagingDialogOpen(true);
  };
  
  const handleEditPackaging = (item: csvLoader.PackageOption) => {
    setCurrentPackagingItem({...item});
    setPackagingDialogOpen(true);
  };
  
  const handleDeletePackaging = (item: csvLoader.PackageOption) => {
    // In a real app, you would call the backend to delete the item
    // For now, we'll just filter it out of the local state
    setPackagingData(packagingData.filter(p => 
      !(p.prod_type === item.prod_type && 
        p.product === item.product && 
        p.box_qty === item.box_qty && 
        p.transport_mode === item.transport_mode)
    ));
  };
  
  const handlePackagingDialogClose = () => {
    setPackagingDialogOpen(false);
    setCurrentPackagingItem(null);
  };
  
  const handlePackagingDialogSave = () => {
    if (!currentPackagingItem) return;
    
    // Check if this is an edit or an add
    const existingIndex = packagingData.findIndex(p => 
      p.prod_type === currentPackagingItem.prod_type && 
      p.product === currentPackagingItem.product && 
      p.box_qty === currentPackagingItem.box_qty && 
      p.transport_mode === currentPackagingItem.transport_mode
    );
    
    if (existingIndex >= 0) {
      // Update existing item
      const newData = [...packagingData];
      newData[existingIndex] = currentPackagingItem;
      setPackagingData(newData);
    } else {
      // Add new item
      setPackagingData([...packagingData, currentPackagingItem]);
    }
    
    setPackagingDialogOpen(false);
    setCurrentPackagingItem(null);
  };
  
  // Rate table handlers
  const handleAddRate = () => {
    setCurrentRateItem({
      product: '',
      trim_type: '',
      rm_spec: '',
      rate_per_kg: 0
    });
    setRateDialogOpen(true);
  };
  
  const handleEditRate = (item: csvLoader.RateOption) => {
    setCurrentRateItem({...item});
    setRateDialogOpen(true);
  };
  
  const handleDeleteRate = (item: csvLoader.RateOption) => {
    // In a real app, you would call the backend to delete the item
    // For now, we'll just filter it out of the local state
    setRateData(rateData.filter(r => 
      !(r.product === item.product && 
        r.trim_type === item.trim_type && 
        r.rm_spec === item.rm_spec)
    ));
    setDataChanged(true);
  };
  
  // Handle delete all packaging data
  const handleDeleteAllPackaging = async () => {
    if (!selectedFactory) return;
    
    // Ask for confirmation before deleting all
    if (window.confirm(`Are you sure you want to delete ALL packaging rates for ${selectedFactory.name}? This cannot be undone.`)) {
      try {
        setLoading(true);
        
        // Use contextUpdateFactoryData to save empty array directly to backend
        await contextUpdateFactoryData(
          selectedFactory.id, 
          [], // Empty array for packagingData
          undefined, // Don't modify rateData
          undefined, // Don't modify chargeRates
          undefined, // Don't modify palletCharge
          undefined  // Don't modify terminalCharge
        );
        
        // Update local state
        setPackagingData([]);
        setDataChanged(false);
        
        // Force update the factory object to have empty packaging data
        if (selectedFactory) {
          selectedFactory.packagingData = [];
        }
        
        setError(`All packaging rates for ${selectedFactory.name} have been deleted successfully.`);
        setTimeout(() => setError(null), 5000);
      } catch (err: any) {
        console.error("Error deleting all packaging rates:", err);
        setError(`Failed to delete packaging rates: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle delete all rate data
  const handleDeleteAllRates = async () => {
    if (!selectedFactory) return;
    
    // Ask for confirmation before deleting all
    if (window.confirm(`Are you sure you want to delete ALL product rates for ${selectedFactory.name}? This cannot be undone.`)) {
      try {
        setLoading(true);
        
        // Use the clearFactoryData function for a more direct deletion
        await contextUpdateFactoryData(selectedFactory.id, undefined, []);
        
        // Update local state
        setRateData([]);
        setDataChanged(false);
        
        // Update factory object directly to ensure empty arrays are preserved
        if (selectedFactory) {
          selectedFactory.rateData = [];
        }
        
        setError(`All product rates for ${selectedFactory.name} have been cleared successfully.`);
      } catch (err: any) {
        console.error("Error deleting rate data:", err);
        setError(`Failed to delete rate data: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleRateDialogClose = () => {
    setRateDialogOpen(false);
    setCurrentRateItem(null);
  };
  
  const handleRateDialogSave = () => {
    if (!currentRateItem) return;
    
    // Check if this is an edit or an add
    const existingIndex = rateData.findIndex(r => 
      r.product === currentRateItem.product && 
      r.trim_type === currentRateItem.trim_type && 
      r.rm_spec === currentRateItem.rm_spec
    );
    
    if (existingIndex >= 0) {
      // Update existing item
      const newData = [...rateData];
      newData[existingIndex] = currentRateItem;
      setRateData(newData);
    } else {
      // Add new item
      setRateData([...rateData, currentRateItem]);
    }
    
    setRateDialogOpen(false);
    setCurrentRateItem(null);
  };
  
  // Helper function to update current packaging item
  const updatePackagingItem = (field: keyof csvLoader.PackageOption, value: string | number) => {
    if (!currentPackagingItem) return;
    
    setCurrentPackagingItem({
      ...currentPackagingItem,
      [field]: field === 'packaging_rate' ? Number(value) : value
    });
  };
  
  // Helper function to update current rate item
  const updateRateItem = (field: keyof csvLoader.RateOption, value: string | number) => {
    if (!currentRateItem) return;
    
    setCurrentRateItem({
      ...currentRateItem,
      [field]: field === 'rate_per_kg' ? Number(value) : value
    });
  };
  
  // Helper function to update new factory
  const updateNewFactory = (field: 'name' | 'location', value: string) => {
    setNewFactory({
      ...newFactory,
      [field]: value
    });
  };
  
  // Rename the local updateFactoryData function to avoid conflict
  const updateLocalFactoryData = async (factory: Factory) => {
    try {
      setLoading(true);
      
      // Load factory data from the API directly
      await loadFactoryData(factory);
      
      setDataChanged(false);
    } catch (err: any) {
      console.error("Error loading factory data:", err);
      setError(`Failed to load factory data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Save all changes
  const handleSaveAllChanges = async () => {
    if (!selectedFactory) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Saving data for factory:", selectedFactory.id);
      
      // Make sure packaging data is properly formatted
      const formattedPackagingData = packagingData.map(item => ({
        ...item,
        packaging_rate: typeof item.packaging_rate === 'string' 
          ? parseFloat(item.packaging_rate) || 0 
          : (item.packaging_rate || 0)
      }));
      
      // Make sure rate data is properly formatted
      const formattedRateData = rateData.map(item => ({
        ...item,
        rate_per_kg: typeof item.rate_per_kg === 'string' 
          ? parseFloat(item.rate_per_kg) || 0 
          : (item.rate_per_kg || 0)
      }));
      
      console.log("Formatted packaging data to save:", formattedPackagingData);
      console.log("Formatted rate data to save:", formattedRateData);
      
      // Validate that all data contains required fields
      const validPackagingData = formattedPackagingData.filter(item => 
        item.prod_type && item.product && 
        (item.packaging_rate !== null && item.packaging_rate !== undefined)
      );
      
      const validRateData = formattedRateData.filter(item => 
        item.product && 
        (item.rate_per_kg !== null && item.rate_per_kg !== undefined)
      );
      
      if (validPackagingData.length !== formattedPackagingData.length) {
        console.warn(`Filtered out ${formattedPackagingData.length - validPackagingData.length} invalid packaging data items`);
      }
      
      if (validRateData.length !== formattedRateData.length) {
        console.warn(`Filtered out ${formattedRateData.length - validRateData.length} invalid rate data items`);
      }
      
      // SUPER CRITICAL FIX: After saving, we need to ensure deleted data stays deleted
      // This is a comprehensive approach that forces updates at multiple levels
      if (selectedFactory) {
        const isPackagingDataDeleted = validPackagingData.length === 0;
        const isRateDataDeleted = validRateData.length === 0;
        
        if (isPackagingDataDeleted || isRateDataDeleted) {
          console.log("DELETE OPERATION DETECTED - IMPLEMENTING MULTI-LEVEL FIX");
          
          // 1. First update the local component state
          if (isPackagingDataDeleted) {
            console.log("Forcing empty packaging data in component state");
            setPackagingData([]);
            
            // Force update the selected factory object directly
            selectedFactory.packagingData = [];
          }
          
          if (isRateDataDeleted) {
            console.log("Forcing empty rate data in component state");
            setRateData([]);
            
            // Force update the selected factory object directly
            selectedFactory.rateData = [];
          }
          
          // 2. Force-update factories list in context to ensure it's consistently empty
          factories.forEach(f => {
            if (f.id === selectedFactory.id) {
              if (isPackagingDataDeleted) {
                f.packagingData = [];
              }
              if (isRateDataDeleted) {
                f.rateData = [];
              }
            }
          });
          
          // 3. Add a flag to temporarily disable auto-loading on navigation
          console.log("Setting delete operation flag");
          sessionStorage.setItem('factoryDeleteOperation', 'true');
          sessionStorage.setItem('deletedFactoryId', selectedFactory.id.toString());
          
          // 4. Skip loading from server entirely for delete operations
          console.log("Skipping data reload after deletion operation");
        } else {
          // Only reload data for non-delete operations
          console.log("Not a deletion operation - refreshing data");
          loadFactoryData(selectedFactory);
        }
      }
      
      await contextUpdateFactoryData(
        selectedFactory.id, 
        validPackagingData,
        validRateData,
        undefined,
        selectedFactory.palletCharge,
        selectedFactory.terminalCharge,
        selectedFactory.receptionFee,
        selectedFactory.dispatchFee,
        selectedFactory.environmentalFeePercentage,
        selectedFactory.electricityFeePercentage
      );
      
      setDataChanged(false);
      const successMsg = `Data saved successfully! Saved ${validPackagingData.length} packaging rates and ${validRateData.length} product rates for ${selectedFactory.name}.`;
      setError(successMsg);
      
      // Show success message for longer (5 seconds)
      setTimeout(() => setError(null), 5000);
    } catch (err: any) {
      console.error('Error saving changes:', err);
      let errorMsg = 'Failed to save changes';
      
      // Handle different error response formats
      if (err.response) {
        console.log('Error response data:', err.response.data);
        if (err.response.data.message) {
          errorMsg += `: ${err.response.data.message}`;
        } else if (err.response.data.error) {
          errorMsg += `: ${err.response.data.error}`;
          if (err.response.data.message) {
            errorMsg += ` - ${err.response.data.message}`;
          }
        } else {
          errorMsg += `: ${err.message || 'Unknown error'}`;
        }
      } else if (err.message) {
        errorMsg += `: ${err.message}`;
      }
      
      setError(errorMsg + '. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // CSV Import handlers
  const handlePackagingFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    console.log("File selected:", file.name, file.type, file.size);
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const csvContent = e.target?.result as string;
        if (!csvContent) {
          console.error('Failed to read file content');
          setError('Failed to read file content');
          setLoading(false);
          return;
        }
        
        console.log("CSV content length:", csvContent.length);
        console.log("CSV content preview:", csvContent.substring(0, 200));
        
        // Check for minimum content length to be valid
        if (csvContent.length < 10) {
          setError('CSV file is too small or empty. Please check the file content.');
          setLoading(false);
          return;
        }
        
        try {
          const parsedData = csvLoader.parseCSV(csvContent);
          console.log("Parsed data:", parsedData);
          
          // Validate the CSV structure
          if (!validatePackagingCSV(parsedData)) {
            console.error('Invalid CSV format', parsedData);
            setError('Invalid packaging CSV format. Please ensure your CSV has the correct columns: prod_type, product, box_qty, pack, transport_mode, packaging_rate');
            setLoading(false);
            return;
          }
          
          // Convert to PackageOption type
          const formattedData: csvLoader.PackageOption[] = parsedData.map(item => ({
            prod_type: item.prod_type || '',
            product: item.product || '',
            box_qty: item.box_qty || '',
            pack: item.pack || '',
            transport_mode: item.transport_mode || '',
            packaging_rate: Number(item.packaging_rate) || 0
          }));
          
          console.log("Formatted data:", formattedData);
          
          if (formattedData.length === 0) {
            setError('No valid data found in the CSV file. Please check the file format and content.');
            setLoading(false);
            return;
          }
          
          setPackagingData(formattedData);
          setDataChanged(true);
          setError('Packaging data imported successfully!');
          setTimeout(() => setError(null), 3000);
        } catch (csvError: any) {
          console.error('CSV parsing error:', csvError);
          setError(`CSV parsing error: ${csvError.message}. Please check your file format.`);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.error('Error processing CSV:', err);
        setError(`Failed to process CSV file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
        // Reset file input
        if (packagingFileInputRef.current) {
          packagingFileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      setError('Failed to read file');
      setLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const handleRateFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log("File selected:", file.name, file.type, file.size);
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const csvContent = e.target?.result as string;
        if (!csvContent) {
          setError('Failed to read file content');
          setLoading(false);
          return;
        }
        
        console.log("CSV content length:", csvContent.length);
        console.log("CSV content preview:", csvContent.substring(0, 200));
        
        // Check for minimum content length to be valid
        if (csvContent.length < 10) {
          setError('CSV file is too small or empty. Please check the file content.');
          setLoading(false);
          return;
        }
        
        try {
          const parsedData = csvLoader.parseCSV(csvContent);
          console.log("Parsed data:", parsedData);
          
          // Validate the CSV structure
          if (!validateRateCSV(parsedData)) {
            console.error('Invalid CSV format', parsedData);
            setError('Invalid rate CSV format. Please ensure your CSV has the correct columns: product, trim_type, rm_spec, rate_per_kg');
            setLoading(false);
            return;
          }
          
          // Convert to RateOption type
          const formattedData: csvLoader.RateOption[] = parsedData.map(item => ({
            product: item.product || '',
            trim_type: item.trim_type || '',
            rm_spec: item.rm_spec || '',
            rate_per_kg: Number(item.rate_per_kg) || 0
          }));
          
          console.log("Formatted data:", formattedData);
          
          if (formattedData.length === 0) {
            setError('No valid data found in the CSV file. Please check the file format and content.');
            setLoading(false);
            return;
          }
          
          setRateData(formattedData);
          setDataChanged(true);
          setError('Rate data imported successfully!');
          setTimeout(() => setError(null), 3000);
        } catch (csvError: any) {
          console.error('CSV parsing error:', csvError);
          setError(`CSV parsing error: ${csvError.message}. Please check your file format.`);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.error('Error processing CSV:', err);
        setError(`Failed to process CSV file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
        // Reset file input
        if (rateFileInputRef.current) {
          rateFileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      setError('Failed to read file');
      setLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  // CSV Export handlers
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      setError('No data to export');
      return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Headers row
      ...data.map(row => 
        headers.map(header => 
          // Handle values with commas by quoting them
          typeof row[header] === 'string' && row[header].includes(',') ? 
            `"${row[header]}"` : 
            row[header]
        ).join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleExportPackagingData = () => {
    exportToCSV(packagingData, `${selectedFactory?.name || 'factory'}_packaging_rates.csv`);
  };
  
  const handleExportRateData = () => {
    exportToCSV(rateData, `${selectedFactory?.name || 'factory'}_product_rates.csv`);
  };
  
  // CSV Validation helpers
  const validatePackagingCSV = (data: any[]): boolean => {
    if (data.length === 0) {
      console.error('CSV data is empty');
      return false;
    }
    
    const firstRow = data[0];
    console.log("First row keys:", Object.keys(firstRow));
    
    const requiredColumns = ['prod_type', 'product', 'box_qty', 'pack', 'transport_mode', 'packaging_rate'];
    const missingColumns = requiredColumns.filter(col => !Object.keys(firstRow).includes(col));
    
    if (missingColumns.length > 0) {
      console.error('Missing columns:', missingColumns);
      return false;
    }
    
    return true;
  };
  
  const validateRateCSV = (data: any[]): boolean => {
    if (data.length === 0) return false;
    
    const requiredColumns = ['product', 'trim_type', 'rm_spec', 'rate_per_kg'];
    return requiredColumns.every(col => Object.keys(data[0]).includes(col));
  };

  // Template help handlers
  const handleOpenTemplateHelp = (type: 'packaging' | 'rate') => {
    setHelpDialogType(type);
    setHelpDialogOpen(true);
  };
  
  const handleCloseTemplateHelp = () => {
    setHelpDialogOpen(false);
  };
  
  // Download template handlers
  const handleDownloadPackagingTemplate = () => {
    downloadTemplate(PACKAGING_CSV_TEMPLATE, 'packaging_template.csv');
  };
  
  const handleDownloadRateTemplate = () => {
    downloadTemplate(RATE_CSV_TEMPLATE, 'rate_template.csv');
  };

  // Add inline editing functionality
  const handleCellClick = (table: 'packaging' | 'rate', id: string, field: string, value: string | number) => {
    setEditingCell({ table, id, field, value });
  };
  
  const generateCellId = (table: 'packaging' | 'rate', item: any, field: string) => {
    if (table === 'packaging') {
      const packageItem = item as csvLoader.PackageOption;
      return `${packageItem.prod_type}-${packageItem.product}-${packageItem.box_qty}-${packageItem.transport_mode}-${field}`;
    } else {
      const rateItem = item as csvLoader.RateOption;
      return `${rateItem.product}-${rateItem.trim_type}-${rateItem.rm_spec}-${field}`;
    }
  };
  
  const handleCellEdit = (value: string) => {
    if (!editingCell) return;
    
    const { table, id, field } = editingCell;
    
    if (table === 'packaging') {
      const newData = [...packagingData];
      const [prodType, product, boxQty, transportMode] = id.split('-').slice(0, 4);
      
      const index = newData.findIndex(item => 
        item.prod_type === prodType &&
        item.product === product &&
        item.box_qty === boxQty &&
        item.transport_mode === transportMode
      );
      
      if (index !== -1) {
        const numberValue = !isNaN(Number(value)) ? Number(value) : value;
        (newData[index] as any)[field] = numberValue;
        setPackagingData(newData);
        setDataChanged(true);
      }
    } else {
      const newData = [...rateData];
      const [product, trimType, rmSpec] = id.split('-').slice(0, 3);
      
      const index = newData.findIndex(item => 
        item.product === product &&
        item.trim_type === trimType &&
        item.rm_spec === rmSpec
      );
      
      if (index !== -1) {
        const numberValue = !isNaN(Number(value)) ? Number(value) : value;
        (newData[index] as any)[field] = numberValue;
        setRateData(newData);
        setDataChanged(true);
      }
    }
    
    setEditingCell(null);
  };
  
  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      handleCellEdit(target.value);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };
  
  // Render a cell with inline editing support
  const renderEditableCell = (table: 'packaging' | 'rate', item: any, field: string, value: string | number) => {
    const cellId = generateCellId(table, item, field);
    const isEditing = editingCell && editingCell.id === cellId && editingCell.field === field;
    
    // Don't make numeric IDs editable
    const isNumeric = typeof value === 'number' || !isNaN(Number(value));
    const isNumericField = field === 'packaging_rate' || field === 'rate_per_kg';
    
    if (isEditing) {
      return (
        <TextField
          autoFocus
          size="small"
          defaultValue={value}
          variant="standard"
          InputProps={{ 
            sx: { 
              fontSize: '0.875rem',
              p: '0',
              height: '20px'
            }
          }}
          onBlur={(e) => handleCellEdit(e.target.value)}
          onKeyDown={handleCellKeyDown}
        />
      );
    }
    
    return (
      <Box 
        onClick={() => handleCellClick(table, cellId, field, value)}
        sx={{ 
          cursor: 'pointer', 
          '&:hover': { 
            backgroundColor: 'rgba(0, 0, 0, 0.04)' 
          },
          p: '4px',
          borderRadius: '4px'
        }}
      >
        {value}
      </Box>
    );
  };

  // Pagination handlers for packaging rates
  const handlePackagingPageChange = (event: unknown, newPage: number) => {
    setPackagingPage(newPage);
  };
  
  const handlePackagingRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPackagingRowsPerPage(parseInt(event.target.value, 10));
    setPackagingPage(0);
  };
  
  // Pagination handlers for product rates
  const handleRatePageChange = (event: unknown, newPage: number) => {
    setRatePage(newPage);
  };
  
  const handleRateRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRateRowsPerPage(parseInt(event.target.value, 10));
    setRatePage(0);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Header 
        title="Factory Rate Card" 
        showBackButton={true}
        backPath="/dashboard"
        onBack={handleBack}
      />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" color="primary">
            Factory Rate Card Management
          </Typography>
        </Box>
        
        {error && (
          <Alert 
            severity={error.includes('successfully') || error.includes('Success') ? 'success' : 'error'} 
            sx={{ 
              mb: 3, 
              fontSize: '1rem',
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              },
              boxShadow: 2,
              position: 'relative',
              zIndex: 10
            }} 
            variant="filled"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel id="factory-select-label">Select Factory</InputLabel>
                <Select
                  labelId="factory-select-label"
                  id="factory-select"
                  value={selectedFactory?.id || ''}
                  label="Select Factory"
                  onChange={handleFactoryChange}
                >
                  {factories.map((factory) => (
                    <MenuItem key={factory.id} value={factory.id}>
                      {factory.name} ({factory.location})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleAddNewFactory}
                >
                  Add New Factory
                </Button>
                
                {selectedFactory && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSaveAllChanges}
                    disabled={loading}
                  >
                    Save All Changes
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
       {/* Factory Global Charges Section */}
{selectedFactory && (
  <Paper sx={{ p: 3, mb: 4 }}>
    <Typography variant="h6" gutterBottom>Factory Global Charges</Typography>
    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
      These charges are applied at factory level for all enquiries.
    </Typography>
    
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          label="Pallet Charge"
          type="number"
          value={selectedFactory.palletCharge || 0}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && selectedFactory) {
              setSelectedFactory({
                ...selectedFactory,
                palletCharge: value
              });
              setDataChanged(true);
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">{selectedFactory.currency}</InputAdornment>
            ),
            inputProps: { min: 0, step: 0.01 }
          }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          label="Terminal Charge"
          type="number"
          value={selectedFactory.terminalCharge || 0}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && selectedFactory) {
              setSelectedFactory({
                ...selectedFactory,
                terminalCharge: value
              });
              setDataChanged(true);
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">{selectedFactory.currency}</InputAdornment>
            ),
            inputProps: { min: 0, step: 0.01 }
          }}
        />
      </Grid>
      
      {/* New Reception Fee field */}
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          label="Reception Fee"
          type="number"
          value={selectedFactory.receptionFee || 0}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && selectedFactory) {
              setSelectedFactory({
                ...selectedFactory,
                receptionFee: value
              });
              setDataChanged(true);
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">{selectedFactory.currency}</InputAdornment>
            ),
            inputProps: { min: 0, step: 0.01 }
          }}
        />
      </Grid>
      
      {/* New Dispatch Fee field */}
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          label="Dispatch Fee"
          type="number"
          value={selectedFactory.dispatchFee || 0}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && selectedFactory) {
              setSelectedFactory({
                ...selectedFactory,
                dispatchFee: value
              });
              setDataChanged(true);
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">{selectedFactory.currency}</InputAdornment>
            ),
            inputProps: { min: 0, step: 0.01 }
          }}
        />
      </Grid>
      
      {/* New Environmental Fee field (percentage) */}
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          label="Environmental Fee"
          type="number"
          value={selectedFactory.environmentalFeePercentage || 0}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && selectedFactory) {
              setSelectedFactory({
                ...selectedFactory,
                environmentalFeePercentage: value
              });
              setDataChanged(true);
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">%</InputAdornment>
            ),
            inputProps: { min: 0, step: 0.1 }
          }}
        />
      </Grid>
      
      {/* New Electricity Fee field (percentage) */}
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          label="Electricity Fee"
          type="number"
          value={selectedFactory.electricityFeePercentage || 0}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && selectedFactory) {
              setSelectedFactory({
                ...selectedFactory,
                electricityFeePercentage: value
              });
              setDataChanged(true);
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">%</InputAdornment>
            ),
            inputProps: { min: 0, step: 0.1 }
          }}
        />
      </Grid>
    </Grid>
  </Paper>
)}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : selectedFactory ? (
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="rate card tabs">
                <Tab label="Packaging Rates" />
                <Tab label="Product Rates" />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2, flexWrap: 'nowrap'}}>
                {/* Hidden file input for CSV upload */}
                <input
                  ref={packagingFileInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handlePackagingFileUpload}
                />
                

                <Tooltip title="Download template CSV file">
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<HelpOutlineIcon />}
                    onClick={handleDownloadPackagingTemplate}
                  >
                    Get Template
                  </Button>
                </Tooltip>
                
                <Tooltip title="View example CSV content">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setError(
                        'Example CSV content:\n\n' +
                        'prod_type,product,box_qty,pack,transport_mode,packaging_rate\n' +
                        'Fresh,Fillet,10 kg,EPS,regular,2\n' +
                        'Fresh,Fillet,20 kg,EPS,regular,2.5\n' +
                        'Fresh,Fillet,VAC,Foil 2-3,regular,4'
                      );
                    }}
                  >
                    Show Example
                  </Button>
                </Tooltip>
                
                <Tooltip title="Import CSV data">
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<FileUploadIcon />}
                    onClick={() => packagingFileInputRef.current?.click()}
                  >
                    Import CSV
                  </Button>
                </Tooltip>
                
                <Tooltip title="Export to CSV file">
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportPackagingData}
                    disabled={packagingData.length === 0}
                  >
                    Export CSV
                  </Button>
                </Tooltip>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddPackaging}
                >
                  Add Packaging Rate
                </Button>
      
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteAllPackaging}
                    disabled={packagingData.length === 0}
                  >
                    Delete All
                  </Button>
                  </Box>

              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="packaging rates table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Type</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Box Quantity</TableCell>
                      <TableCell>Packaging Type</TableCell>
                      <TableCell>Transport Mode</TableCell>
                      <TableCell>Packaging Rate</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {packagingData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
                            {loading ? "Loading packaging data..." : "No packaging data available"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      packagingData
                        .slice(packagingPage * packagingRowsPerPage, packagingPage * packagingRowsPerPage + packagingRowsPerPage)
                        .map((row, index) => (
                          <TableRow key={`packaging-${row.prod_type}-${row.product}-${row.box_qty}-${row.transport_mode}-${index}`}>
                            <TableCell>{renderEditableCell('packaging', row, 'prod_type', row.prod_type)}</TableCell>
                            <TableCell>{renderEditableCell('packaging', row, 'product', row.product)}</TableCell>
                            <TableCell>{renderEditableCell('packaging', row, 'box_qty', row.box_qty)}</TableCell>
                            <TableCell>{renderEditableCell('packaging', row, 'pack', row.pack)}</TableCell>
                            <TableCell>{renderEditableCell('packaging', row, 'transport_mode', row.transport_mode)}</TableCell>
                            <TableCell>{renderEditableCell('packaging', row, 'packaging_rate', row.packaging_rate)}</TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => handleEditPackaging(row)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeletePackaging(row)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {packagingData.length > 0 
                    ? `Showing ${packagingPage * packagingRowsPerPage + 1} to ${Math.min((packagingPage + 1) * packagingRowsPerPage, packagingData.length)} of ${packagingData.length} packaging rates`
                    : 'No packaging rates available'}
                </Typography>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={packagingData.length}
                  rowsPerPage={packagingRowsPerPage}
                  page={packagingPage}
                  onPageChange={handlePackagingPageChange}
                  onRowsPerPageChange={handlePackagingRowsPerPageChange}
                />
              </Box>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
                {/* Hidden file input for CSV upload */}
                <input
                  ref={rateFileInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleRateFileUpload}
                />
                
                <Tooltip title="Download template CSV file">
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<HelpOutlineIcon />}
                    onClick={handleDownloadRateTemplate}
                  >
                    Get Template
                  </Button>
                </Tooltip>
                
                <Tooltip title="View example CSV content">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setError(
                        'Example CSV content:\n\n' +
                        'product,trim_type,rm_spec,rate_per_kg\n' +
                        'Fillet,Trim A,1-2 kg,14.2\n' +
                        'Fillet,Trim A,2-3 kg,5.7\n' +
                        'Fillet,Trim B,3-4 kg,3.95'
                      );
                    }}
                  >
                    Show Example
                  </Button>
                </Tooltip>
                
                <Tooltip title="Import CSV data">
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<FileUploadIcon />}
                    onClick={() => rateFileInputRef.current?.click()}
                  >
                    Import CSV
                  </Button>
                </Tooltip>
                
                <Tooltip title="Export to CSV file">
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportRateData}
                    disabled={rateData.length === 0}
                  >
                    Export CSV
                  </Button>
                </Tooltip>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddRate}
                >
                  Add Product Rate
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteAllRates}
                  disabled={rateData.length === 0}
                >
                  Delete All
                </Button>
              </Box>
              
              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="product rates table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Trim Type</TableCell>
                      <TableCell>RM Specification</TableCell>
                      <TableCell>Rate Per Kg</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rateData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
                            {loading ? "Loading product rates..." : "No product rates available"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rateData
                        .slice(ratePage * rateRowsPerPage, ratePage * rateRowsPerPage + rateRowsPerPage)
                        .map((row, index) => (
                          <TableRow key={`rate-${row.product}-${row.trim_type}-${row.rm_spec}-${index}`}>
                            <TableCell>{renderEditableCell('rate', row, 'product', row.product)}</TableCell>
                            <TableCell>{renderEditableCell('rate', row, 'trim_type', row.trim_type)}</TableCell>
                            <TableCell>{renderEditableCell('rate', row, 'rm_spec', row.rm_spec)}</TableCell>
                            <TableCell>{renderEditableCell('rate', row, 'rate_per_kg', row.rate_per_kg)}</TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => handleEditRate(row)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeleteRate(row)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {rateData.length > 0 
                    ? `Showing ${ratePage * rateRowsPerPage + 1} to ${Math.min((ratePage + 1) * rateRowsPerPage, rateData.length)} of ${rateData.length} product rates`
                    : 'No product rates available'}
                </Typography>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={rateData.length}
                  rowsPerPage={rateRowsPerPage}
                  page={ratePage}
                  onPageChange={handleRatePageChange}
                  onRowsPerPageChange={handleRateRowsPerPageChange}
                />
              </Box>
            </TabPanel>
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Please select a factory to view and edit rate cards
            </Typography>
          </Paper>
        )}
      </Container>
      
      {/* Packaging Dialog */}
      <Dialog open={packagingDialogOpen} onClose={handlePackagingDialogClose}>
        <DialogTitle>
          {currentPackagingItem && (
            currentPackagingItem.prod_type ? 'Edit Packaging Rate' : 'Add Packaging Rate'
          )}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please enter the packaging rate details below.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                margin="dense"
                label="Product Type"
                fullWidth
                value={currentPackagingItem?.prod_type || ''}
                onChange={(e) => updatePackagingItem('prod_type', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Product"
                fullWidth
                value={currentPackagingItem?.product || ''}
                onChange={(e) => updatePackagingItem('product', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Box Quantity"
                fullWidth
                value={currentPackagingItem?.box_qty || ''}
                onChange={(e) => updatePackagingItem('box_qty', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Packaging Type"
                fullWidth
                value={currentPackagingItem?.pack || ''}
                onChange={(e) => updatePackagingItem('pack', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Transport Mode"
                fullWidth
                value={currentPackagingItem?.transport_mode || ''}
                onChange={(e) => updatePackagingItem('transport_mode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Packaging Rate"
                type="number"
                fullWidth
                value={currentPackagingItem?.packaging_rate || 0}
                onChange={(e) => updatePackagingItem('packaging_rate', e.target.value)}
                inputProps={{ step: 0.01 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePackagingDialogClose}>Cancel</Button>
          <Button onClick={handlePackagingDialogSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rate Dialog */}
      <Dialog open={rateDialogOpen} onClose={handleRateDialogClose}>
        <DialogTitle>
          {currentRateItem && (
            currentRateItem.product ? 'Edit Product Rate' : 'Add Product Rate'
          )}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please enter the product rate details below.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                margin="dense"
                label="Product"
                fullWidth
                value={currentRateItem?.product || ''}
                onChange={(e) => updateRateItem('product', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Trim Type"
                fullWidth
                value={currentRateItem?.trim_type || ''}
                onChange={(e) => updateRateItem('trim_type', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="RM Specification"
                fullWidth
                value={currentRateItem?.rm_spec || ''}
                onChange={(e) => updateRateItem('rm_spec', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Rate Per Kg"
                type="number"
                fullWidth
                value={currentRateItem?.rate_per_kg || 0}
                onChange={(e) => updateRateItem('rate_per_kg', e.target.value)}
                inputProps={{ step: 0.01 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRateDialogClose}>Cancel</Button>
          <Button onClick={handleRateDialogSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* New Factory Dialog */}
      <Dialog open={newFactoryDialogOpen} onClose={handleNewFactoryDialogClose}>
        <DialogTitle>Add New Factory</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please enter the details of the new factory.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Factory Name"
                fullWidth
                value={newFactory.name}
                onChange={(e) => updateNewFactory('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Factory Location"
                fullWidth
                value={newFactory.location}
                onChange={(e) => updateNewFactory('location', e.target.value)}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewFactoryDialogClose}>Cancel</Button>
          <Button onClick={handleNewFactoryDialogSave} variant="contained" color="primary">
            Create Factory
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Template Help Dialog */}
      <Dialog open={helpDialogOpen} onClose={handleCloseTemplateHelp} maxWidth="md">
        <DialogTitle>
          {helpDialogType === 'packaging' ? 'Packaging Rate CSV Format' : 'Product Rate CSV Format'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please ensure your CSV file follows this format:
          </DialogContentText>
          
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Required Columns:
          </Typography>
          
          {helpDialogType === 'packaging' ? (
            <>
              <ul>
                <li><Typography component="span" fontWeight="bold">prod_type</Typography> - Product type (e.g., Fresh, Frozen)</li>
                <li><Typography component="span" fontWeight="bold">product</Typography> - Product name (e.g., Fillet, Portions)</li>
                <li><Typography component="span" fontWeight="bold">box_qty</Typography> - Box quantity/size (e.g., 10 kg, VAC)</li>
                <li><Typography component="span" fontWeight="bold">pack</Typography> - Packaging type (e.g., EPS, Foil 2-3)</li>
                <li><Typography component="span" fontWeight="bold">transport_mode</Typography> - Mode of transport (e.g., regular, AIR)</li>
                <li><Typography component="span" fontWeight="bold">packaging_rate</Typography> - Rate for packaging (numeric value)</li>
              </ul>
              
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Sample CSV content:
              </Typography>
              
              <Box component="pre" sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, overflow: 'auto' }}>
                {PACKAGING_CSV_TEMPLATE}
              </Box>
            </>
          ) : (
            <>
              <ul>
                <li><Typography component="span" fontWeight="bold">product</Typography> - Product name (e.g., Fillet, Portions)</li>
                <li><Typography component="span" fontWeight="bold">trim_type</Typography> - Trim type (e.g., Trim A, Trim B)</li>
                <li><Typography component="span" fontWeight="bold">rm_spec</Typography> - RM specification (e.g., 1-2 kg, 2-3 kg)</li>
                <li><Typography component="span" fontWeight="bold">rate_per_kg</Typography> - Rate per kg (numeric value)</li>
              </ul>
              
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Sample CSV content:
              </Typography>
              
              <Box component="pre" sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, overflow: 'auto' }}>
                {RATE_CSV_TEMPLATE}
              </Box>
            </>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You can download a template using the "Get Template" button and modify it with your data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateHelp} variant="contained">Close</Button>
          <Button 
            onClick={helpDialogType === 'packaging' ? handleDownloadPackagingTemplate : handleDownloadRateTemplate} 
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Download Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FactoryRateCard; 