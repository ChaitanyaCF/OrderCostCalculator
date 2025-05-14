import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Box,
  Divider,
  Alert,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import InquiryService from '../../services/InquiryService';
import { InquiryFormData } from '../../types/types';

interface ChargesResult {
  palletCharge: number;
  terminalCharge: number;
  optionalCharges: Record<string, number>;
  totalCompulsory: number;
  totalOptional: number;
  totalCharges: number;
}

const InquiryForm: React.FC = () => {
  // Form state
  const [product, setProduct] = useState('');
  const [trimType, setTrimType] = useState('');
  const [rmSpec, setRmSpec] = useState('');
  const [yieldValue, setYieldValue] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [productType, setProductType] = useState('');
  const [packagingType, setPackagingType] = useState('');
  const [packagingSize, setPackagingSize] = useState('');
  const [transportMode, setTransportMode] = useState('');
  
  // Options for checkboxes
  const [prodaB, setProdaB] = useState(false);
  const [encoding, setEncoding] = useState(false);
  
  // Rate calculations
  const [filingRate, setFilingRate] = useState<number | null>(null);
  const [packagingRate, setPackagingRate] = useState<number | null>(null);
  
  // Charge calculations
  const [charges, setCharges] = useState<ChargesResult | null>(null);
  
  // Form options from API
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [trimTypeOptions, setTrimTypeOptions] = useState<string[]>([]);
  const [rmSpecOptions, setRmSpecOptions] = useState<string[]>([]);
  const [prodTypeOptions, setProdTypeOptions] = useState<string[]>([]);
  const [packagingTypeOptions, setPackagingTypeOptions] = useState<string[]>([]);
  const [packagingSizeOptions, setPackagingSizeOptions] = useState<string[]>([]);
  const [transportModeOptions, setTransportModeOptions] = useState<string[]>([]);
  
  // Form status
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Load initial form options
  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        setLoading(true);
        const products = await InquiryService.getProductOptions();
        const rmSpecs = await InquiryService.getRmSpecs();
        const prodTypes = await InquiryService.getProdTypes();
        const transportModes = await InquiryService.getTransportModes();
        
        setProductOptions(products);
        setRmSpecOptions(rmSpecs);
        setProdTypeOptions(prodTypes);
        setTransportModeOptions(transportModes);
        
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load form options');
      } finally {
        setLoading(false);
      }
    };
    
    loadFormOptions();
  }, []);
  
  // Load trim types when product changes
  useEffect(() => {
    if (product) {
      const loadTrimTypes = async () => {
        try {
          const trimTypes = await InquiryService.getTrimTypes(product);
          setTrimTypeOptions(trimTypes);
          setTrimType('');
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load trim types');
        }
      };
      
      loadTrimTypes();
    } else {
      setTrimTypeOptions([]);
      setTrimType('');
    }
  }, [product]);
  
  // Load packaging types and sizes when product type changes
  useEffect(() => {
    if (product && productType) {
      const loadPackagingOptions = async () => {
        try {
          const packTypes = await InquiryService.getPackagingTypes(product, productType);
          const packSizes = await InquiryService.getPackagingSizes(product, productType);
          
          setPackagingTypeOptions(packTypes);
          setPackagingSizeOptions(packSizes);
          setPackagingType('');
          setPackagingSize('');
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load packaging options');
        }
      };
      
      loadPackagingOptions();
    } else {
      setPackagingTypeOptions([]);
      setPackagingSizeOptions([]);
      setPackagingType('');
      setPackagingSize('');
    }
  }, [product, productType]);
  
  // Calculate rates when form values change
  useEffect(() => {
    if (product && trimType && rmSpec && productType && packagingType && transportMode) {
      const calculateRates = async () => {
        try {
          const rates = await InquiryService.calculateRates(
            product, 
            trimType, 
            rmSpec, 
            productType, 
            packagingType, 
            transportMode
          );
          
          setFilingRate(rates.filingRate);
          setPackagingRate(rates.packagingRate);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to calculate rates');
          setFilingRate(null);
          setPackagingRate(null);
        }
      };
      
      calculateRates();
    } else {
      setFilingRate(null);
      setPackagingRate(null);
    }
  }, [product, trimType, rmSpec, productType, packagingType, transportMode]);
  
  // Calculate charges when weight, yield and rates are available
  useEffect(() => {
    if (
      yieldValue !== '' && 
      weight !== '' && 
      filingRate !== null && 
      packagingRate !== null
    ) {
      const calculateCharges = async () => {
        try {
          const options = {
            prodaB: prodaB,
            encoding: encoding
          };
          
          const result = await InquiryService.calculateCharges(
            Number(yieldValue), 
            Number(weight), 
            options
          );
          
          // Calculate optional charges sum
          let optionalSum = 0;
          if (result.optionalCharges) {
            for (const key in result.optionalCharges) {
              optionalSum += Number(result.optionalCharges[key]);
            }
          }
          
          // Create the properly formatted charges result
          const formattedResult: ChargesResult = {
            palletCharge: result.palletCharge,
            terminalCharge: result.terminalCharge,
            optionalCharges: result.optionalCharges || {},
            totalCompulsory: (result.palletCharge + result.terminalCharge),
            totalOptional: optionalSum,
            totalCharges: result.totalCharges
          };
          
          setCharges(formattedResult);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to calculate charges');
          setCharges(null);
        }
      };
      
      calculateCharges();
    } else {
      setCharges(null);
    }
  }, [yieldValue, weight, filingRate, packagingRate, prodaB, encoding]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (
      !product || 
      !trimType || 
      !rmSpec || 
      yieldValue === '' || 
      weight === '' || 
      !productType || 
      !packagingType || 
      !packagingSize || 
      !transportMode ||
      !charges
    ) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const inquiryData: InquiryFormData = {
        product,
        trimType,
        rmSpec,
        yieldValue: Number(yieldValue),
        productType,
        packagingType,
        packagingSize,
        transportMode,
        filingRate,
        packagingRate,
        palletCharge: charges.palletCharge,
        terminalCharge: charges.terminalCharge,
        optionalCharges: {
          prodaB: charges.optionalCharges.prodaB || 0,
          encoding: charges.optionalCharges.encoding || 0
        },
        totalCharges: charges.totalCharges
      };
      
      const result = await InquiryService.saveInquiry(inquiryData);
      setSuccess(result.message || 'Inquiry saved successfully');
      setError(null);
      
      // Reset form
      setProduct('');
      setTrimType('');
      setRmSpec('');
      setYieldValue('');
      setWeight('');
      setProductType('');
      setPackagingType('');
      setPackagingSize('');
      setTransportMode('');
      setProdaB(false);
      setEncoding(false);
      setFilingRate(null);
      setPackagingRate(null);
      setCharges(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save inquiry');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="inquiry-form-container">
      <Paper className="inquiry-form" elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          New Inquiry
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Product Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Information
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '30%' }}>
                <FormControl fullWidth required>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={product}
                    label="Product"
                    onChange={(e: SelectChangeEvent) => setProduct(e.target.value)}
                  >
                    {productOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '30%' }}>
                <FormControl fullWidth required disabled={!product}>
                  <InputLabel>Trim Type</InputLabel>
                  <Select
                    value={trimType}
                    label="Trim Type"
                    onChange={(e: SelectChangeEvent) => setTrimType(e.target.value)}
                  >
                    {trimTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '30%' }}>
                <FormControl fullWidth required>
                  <InputLabel>RM Spec</InputLabel>
                  <Select
                    value={rmSpec}
                    label="RM Spec"
                    onChange={(e: SelectChangeEvent) => setRmSpec(e.target.value)}
                  >
                    {rmSpecOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '45%' }}>
                <TextField
                  fullWidth
                  required
                  label="Yield Value (%)"
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  value={yieldValue}
                  onChange={(e) => setYieldValue(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </Box>
              
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '45%' }}>
                <TextField
                  fullWidth
                  required
                  label="Weight (kg)"
                  type="number"
                  inputProps={{ step: "0.1", min: "0" }}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            {/* Packaging Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Packaging Information
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '30%' }}>
                <FormControl fullWidth required>
                  <InputLabel>Product Type</InputLabel>
                  <Select
                    value={productType}
                    label="Product Type"
                    onChange={(e: SelectChangeEvent) => setProductType(e.target.value)}
                  >
                    {prodTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '30%' }}>
                <FormControl fullWidth required disabled={!productType || !product}>
                  <InputLabel>Packaging Type</InputLabel>
                  <Select
                    value={packagingType}
                    label="Packaging Type"
                    onChange={(e: SelectChangeEvent) => setPackagingType(e.target.value)}
                  >
                    {packagingTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '30%' }}>
                <FormControl fullWidth required disabled={!productType || !product}>
                  <InputLabel>Packaging Size</InputLabel>
                  <Select
                    value={packagingSize}
                    label="Packaging Size"
                    onChange={(e: SelectChangeEvent) => setPackagingSize(e.target.value)}
                  >
                    {packagingSizeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Transport Mode</InputLabel>
                <Select
                  value={transportMode}
                  label="Transport Mode"
                  onChange={(e: SelectChangeEvent) => setTransportMode(e.target.value)}
                >
                  {transportModeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box>
              <Typography variant="h6" gutterBottom>
                Optional Charges
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '45%' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={prodaB}
                      onChange={(e) => setProdaB(e.target.checked)}
                    />
                  }
                  label="Prod A/B"
                />
              </Box>
              
              <Box sx={{ flexGrow: 1, minWidth: '250px', flexBasis: '45%' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={encoding}
                      onChange={(e) => setEncoding(e.target.checked)}
                    />
                  }
                  label="Encoding"
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Inquiry'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </div>
  );
};

export default InquiryForm;