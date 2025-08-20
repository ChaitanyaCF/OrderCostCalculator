import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SelectChangeEvent,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Header from '../layout/Header';
import { useAuth } from '../../context/AuthContext';
import { useFactory } from '../../context/FactoryContext';
import { EmailEnquiry } from '../../services/EmailEnquiryService';
import { ProductInformation } from './ProductInformation';
import { PackagingDetails } from './PackagingDetails';
import { CostSummary } from './CostSummary';
import AuthService from '../../services/AuthService';
import { API_BASE_URL } from '../../config';

interface QuoteGenerationProps {}

interface SKUFormData {
  id: string;
  // Original extracted data
  customerSkuReference: string
  productDescription: string;
  requestedQuantity: number;
  deliveryRequirement: string;
  specialInstructions: string;
  
  // AI-parsed fields (static - should not change)
  aiParsedProductType: string;
  aiParsedProduct: string;
  aiParsedTrimType: string;
  aiParsedPackagingType: string;
  aiParsedBoxQty: string;
  aiParsedProductCut: string;
  
  // Form fields (exactly like NewEnquiry)
  productType: string;
  product: string;
  trimType: string;
  rmSpec: string;
  yieldValue: number;
  freezingType: string;
  isStorageRequired: boolean;
  numberOfWeeks: number;
  boxQty: string;
  packagingType: string;
  transportMode: string;
  quantity: number;
  
  // Calculated rates (exactly like NewEnquiry)
  packagingRate: number;
  palletCharge: number;
  terminalCharge: number;
  freezingRate: number;
  filletingRate: number;
  totalCost: number;
  receptionFee: number;
  dispatchFee: number;
  environmentalFee: number;
  electricityFee: number;
  
  // Optional charges
  optionalCharges: Array<{chargeValue: number}>;
}

const QuoteGeneration: React.FC<QuoteGenerationProps> = () => {
  const { enquiryId } = useParams<{ enquiryId: string }>();
  const navigate = useNavigate();
  const { factories, selectedFactory, setSelectedFactory, loadFactoryData } = useFactory();
  
  // State (exactly like NewEnquiry)
  const [emailEnquiry, setEmailEnquiry] = useState<EmailEnquiry | null>(null);
  const [skuForms, setSkuForms] = useState<SKUFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [trimTypes, setTrimTypes] = useState<string[]>([]);
  const [rmSpecs, setRmSpecs] = useState<string[]>([]);
  
  // Toggle states for each SKU (exactly like NewEnquiry)
  const [palletChargeEnabled, setPalletChargeEnabled] = useState(true);
  const [terminalChargeEnabled, setTerminalChargeEnabled] = useState(true);
  const [receptionFeeEnabled, setReceptionFeeEnabled] = useState(false);
  
  // Email content and UI states
  const [emailContentVisible, setEmailContentVisible] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [dispatchFeeEnabled, setDispatchFeeEnabled] = useState(false);
  const [environmentalFeeEnabled, setEnvironmentalFeeEnabled] = useState(false);
  const [electricityFeeEnabled, setElectricityFeeEnabled] = useState(false);
  const [prodABEnabled, setProdABEnabled] = useState(false);
  const [descalingEnabled, setDescalingEnabled] = useState(false);
  const [portionSkinOnEnabled, setPortionSkinOnEnabled] = useState(false);
  const [portionSkinOffEnabled, setPortionSkinOffEnabled] = useState(false);

  // Load enquiry data
  useEffect(() => {
    const loadEnquiryData = async () => {
      if (!enquiryId) {
        setError('No enquiry ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/email-enquiries/by-enquiry-id/${enquiryId}`, {
          headers: {
            'Authorization': `Bearer ${AuthService.getCurrentUser()?.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load enquiry data');
        }

        const data: EmailEnquiry = await response.json();
        setEmailEnquiry(data);

        // Initialize SKU forms from enquiry items (simplified)
        const initialForms: SKUFormData[] = data.enquiryItems.map((item, index) => ({
            id: `sku-${index}`,
            customerSkuReference: item.customerSkuReference || '',
            productDescription: item.productDescription || '',
          requestedQuantity: item.requestedQuantity || 0,
            deliveryRequirement: item.deliveryRequirement || '',
            specialInstructions: item.specialInstructions || '',
            
          // AI-parsed fields (static)
          aiParsedProductType: item.productType || 'UNKNOWN',
          aiParsedProduct: item.product || 'UNKNOWN',
          aiParsedTrimType: item.trimType || 'UNKNOWN',
          aiParsedPackagingType: item.packagingType || 'UNKNOWN',
          aiParsedBoxQty: item.boxQuantity || 'Not specified',
          aiParsedProductCut: item.product || 'UNKNOWN',
          
          // Form fields - initialize with smart defaults based on AI-parsed data
          productType: item.productType === 'FROZEN' ? 'Frozen' : (item.productType === 'FRESH' ? 'Fresh' : ''),
          product: item.product === 'UNKNOWN' ? '' : (item.product || ''),
          trimType: (item.trimType && item.trimType !== 'UNKNOWN' && item.trimType !== 'N/A') ? 
            (item.trimType.length === 1 ? `Trim ${item.trimType}` : item.trimType) : '',
          rmSpec: (item.rmSpec && item.rmSpec !== 'UNKNOWN' && item.rmSpec !== 'N/A') ? 
            item.rmSpec.replace(/(\d+)-(\d+)kg/, '$1-$2 kg') : '',
            yieldValue: 0,
          freezingType: 'Tunnel Freezing', // Default for frozen products
          isStorageRequired: false,
          numberOfWeeks: 1.0,
          boxQty: (item.boxQuantity && item.boxQuantity !== 'Not specified' && item.boxQuantity !== 'N/A') ? item.boxQuantity : '',
          packagingType: (item.packagingType && item.packagingType !== 'UNKNOWN' && item.packagingType !== 'N/A') ? item.packagingType : '',
          transportMode: item.transportMode === 'UNKNOWN' ? '' : (item.transportMode || ''),
          quantity: item.requestedQuantity || 0,
          
          // Calculated rates - start at 0 like NewEnquiry
            packagingRate: 0,
            palletCharge: 0,
            terminalCharge: 0,
            freezingRate: 0,
            filletingRate: 0,
            totalCost: 0,
          receptionFee: 0,
          dispatchFee: 0,
          environmentalFee: 0,
          electricityFee: 0,
          
          optionalCharges: [] as Array<{chargeValue: number}>
        }));

        setSkuForms(initialForms);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load enquiry data');
        setLoading(false);
      }
    };

    loadEnquiryData();
  }, [enquiryId]);

  // Auto-select first factory if none selected
  useEffect(() => {
    if (!selectedFactory && factories.length > 0) {
      console.log('Auto-selecting first factory:', factories[0].name);
      setSelectedFactory(factories[0]);
    }
  }, [factories, selectedFactory, setSelectedFactory]);

  // Load factory data when factory is selected (exactly like NewEnquiry)
  useEffect(() => {
    if (selectedFactory) {
      // If factory doesn't have packaging data, try to load it from backend
      if (!selectedFactory.packagingData || selectedFactory.packagingData.length === 0) {
        console.log('No packaging data found, attempting to load from backend');
        loadFactoryData(selectedFactory).catch(err => {
          console.warn('Failed to load factory data from backend:', err);
        });
      }
    }
  }, [selectedFactory, loadFactoryData]);

  // Load product types from factory data (exactly like NewEnquiry)
  useEffect(() => {
    if (selectedFactory?.packagingData && selectedFactory.packagingData.length > 0) {
      const uniqueProductTypes = Array.from(
        new Set(selectedFactory.packagingData.map(p => p.prod_type).filter(Boolean))
      ).sort();
      setProductTypes(uniqueProductTypes);
    } else {
      // Fallback to default product types if no factory data
      const defaultProductTypes = ['Fresh', 'Frozen'];
      setProductTypes(defaultProductTypes);
    }
  }, [selectedFactory]);

  // Initialize default options if no factory data (exactly like NewEnquiry)
  useEffect(() => {
    if (selectedFactory && (!selectedFactory.packagingData || selectedFactory.packagingData.length === 0)) {
      console.log('Initializing default options for factory:', selectedFactory.name);
      
      // Default products
      const defaultProducts = ['Salmon', 'Cod', 'Trout'];
      setProducts(defaultProducts);
      
      // Default trim types  
      const defaultTrimTypes = ['Fillet', 'Portion', 'Trim A', 'Trim B', 'Trim C', 'Trim D', 'Trim E', 'HOG'];
      setTrimTypes(defaultTrimTypes);
      
      // Default RM specs
      const defaultRmSpecs = ['1-2 kg', '2-3 kg', '3-4 kg', '4-5 kg', '5-6 kg', '6-7 kg', '7+ kg'];
      setRmSpecs(defaultRmSpecs);
    }
  }, [selectedFactory]);

  // Load products from factory data
  useEffect(() => {
    if (selectedFactory?.packagingData && selectedFactory.packagingData.length > 0) {
      const uniqueProducts = Array.from(
        new Set(selectedFactory.packagingData.map(p => p.product).filter(Boolean))
      ).sort();
      setProducts(uniqueProducts);
    }
  }, [selectedFactory]);

  // Load trim types from rate data
  useEffect(() => {
    if (selectedFactory?.rateData && selectedFactory.rateData.length > 0) {
      const uniqueTrimTypes = Array.from(
        new Set(selectedFactory.rateData.map(r => r.trim_type).filter(Boolean))
      ).sort();
      setTrimTypes(uniqueTrimTypes);
    }
  }, [selectedFactory]);

  // Load trim types for each SKU when product changes (like NewEnquiry)
  useEffect(() => {
    skuForms.forEach((skuForm, index) => {
      if (skuForm.product && selectedFactory?.rateData) {
        const factoryTrimTypes = selectedFactory.rateData
          .filter(item => item.product === skuForm.product && item.trim_type)
          .map(item => item.trim_type);
        
        const uniqueTrimTypes = Array.from(new Set(factoryTrimTypes.filter(Boolean))).sort();
        setTrimTypes(uniqueTrimTypes);
      }
    });
  }, [skuForms.map(s => s.product).join(','), selectedFactory]);

  // Load RM specs for each SKU when product and trim type change (like NewEnquiry)
  useEffect(() => {
    skuForms.forEach((skuForm, index) => {
      if (skuForm.product && skuForm.trimType && selectedFactory?.rateData) {
        const factoryRmSpecs = selectedFactory.rateData
          .filter(item => 
            item.product === skuForm.product && 
            item.trim_type === skuForm.trimType && 
            item.rm_spec
          )
          .map(item => item.rm_spec);
        
        const uniqueRmSpecs = Array.from(new Set(factoryRmSpecs.filter(Boolean))).sort();
        setRmSpecs(uniqueRmSpecs);
        
        // If this is initial load and we have a pre-filled rmSpec, make sure it's valid
        if (skuForm.rmSpec && !uniqueRmSpecs.includes(skuForm.rmSpec)) {
          console.log(`Pre-filled rmSpec "${skuForm.rmSpec}" not found in available options:`, uniqueRmSpecs);
          // Try to find a close match
          const closeMatch = uniqueRmSpecs.find(spec => spec.includes(skuForm.rmSpec.replace(' kg', 'kg')));
          if (closeMatch) {
            console.log(`Found close match: ${closeMatch}`);
            setSkuForms(prev => prev.map(form => 
              form.id === skuForm.id ? { ...form, rmSpec: closeMatch } : form
            ));
          }
        }
      }
    });
  }, [skuForms.map(s => s.product + '|' + s.trimType).join(','), selectedFactory]);

  // Load RM specs from rate data
  useEffect(() => {
    if (selectedFactory?.rateData && selectedFactory.rateData.length > 0) {
      const uniqueRmSpecs = Array.from(
        new Set(selectedFactory.rateData.map(r => r.rm_spec).filter(Boolean))
      ).sort();
      setRmSpecs(uniqueRmSpecs);
    }
  }, [selectedFactory]);

  // Initialize rates when factory data is loaded
  useEffect(() => {
    if (selectedFactory?.rateData && selectedFactory?.packagingData && selectedFactory?.chargeRates) {
      setSkuForms(prev => prev.map(form => {
        const updatedForm = { ...form };
        
        // Initialize filleting rate if product/trim/rm spec are set
        if (form.product && form.trimType && form.rmSpec && selectedFactory.rateData) {
          const rateData = selectedFactory.rateData.find(item => 
            item.product === form.product && 
            item.trim_type === form.trimType && 
            item.rm_spec === form.rmSpec
          );
          
          if (rateData) {
            console.log('Initializing filleting rate:', rateData.rate_per_kg, 'for', form.product, form.trimType, form.rmSpec);
            updatedForm.filletingRate = rateData.rate_per_kg || 0;
          }
        }
        
        // Initialize packaging rate if product and productType are set
        if (form.product && form.productType && selectedFactory.packagingData) {
          const packagingData = selectedFactory.packagingData.find(item => 
            item.product === form.product && 
            item.prod_type === form.productType
          );
          
          if (packagingData) {
            console.log('Initializing packaging rate:', packagingData.packaging_rate);
            updatedForm.packagingRate = packagingData.packaging_rate || 0;
          }
        }
        
        // Initialize freezing rate if freezingType is set
        if (form.freezingType && selectedFactory.chargeRates) {
          // Try product-specific rate first (like NewEnquiry)
          let freezingRate = selectedFactory.chargeRates.find(rate => 
            (rate.charge_name === 'Freezing Rate' || 
             rate.charge_name === 'Tunnel Freezing Rate' || 
             rate.charge_name === 'Gyro Freezing Rate') &&
            rate.product_type === 'Frozen' &&
            rate.product === form.product &&
            rate.subtype === form.freezingType
          );

          // If no product-specific rate found, try without product constraint
          if (!freezingRate) {
            freezingRate = selectedFactory.chargeRates.find(rate => 
              (rate.charge_name === 'Freezing Rate' || 
               rate.charge_name === 'Tunnel Freezing Rate' || 
               rate.charge_name === 'Gyro Freezing Rate') &&
              rate.product_type === 'Frozen' &&
              rate.subtype === form.freezingType
            );
          }
          
          if (freezingRate) {
            console.log('Initializing freezing rate:', freezingRate.rate_value, 'for', form.freezingType);
            updatedForm.freezingRate = Number(freezingRate.rate_value) || 0;
          }
        }
        
        return updatedForm;
      }));
    }
  }, [selectedFactory?.rateData, selectedFactory?.packagingData, selectedFactory?.chargeRates]);

  // Calculate total cost for each SKU (exactly like NewEnquiry)
  useEffect(() => {
    setSkuForms(prev => prev.map(form => {
      const calculateTotalCost = () => {
        console.log("CALC-DEBUG: Starting cost calculation for SKU:", form.id, {
          productType: form.productType,
          quantity: form.quantity,
          selectedFactory: selectedFactory?.name,
          filletingRate: form.filletingRate,
          packagingRate: form.packagingRate,
          freezingRate: form.freezingRate
        });
        
        // Base unit rates (per kg)
        const packagingRate = Number(form.packagingRate || 0);
        const freezingRate = form.productType === 'Frozen' ? Number(form.freezingRate || 0) : 0;
        const filletingRate = Number(form.filletingRate || 0);
        
        // Additional charges (per kg or fixed)
        const palletCharge = palletChargeEnabled ? Number(form.palletCharge || 0) : 0;
        const terminalCharge = terminalChargeEnabled ? Number(form.terminalCharge || 0) : 0;
        
        // Calculate unit price (sum of all rates per kg)
        const baseUnitPrice = filletingRate + packagingRate + freezingRate + palletCharge + terminalCharge;
        
        // Optional charges (calculated from toggle handlers)
        const optionalTotal = form.optionalCharges.reduce((sum, charge) => {
          return sum + (charge.chargeValue || 0);
        }, 0);

        // Calculate base cost (unit price × quantity + optional charges)
        const baseCost = (baseUnitPrice * form.quantity) + optionalTotal;
        
        // Add per-kg fees for frozen products
        let perKgFees = 0;
        if (form.productType === 'Frozen') {
          // Add reception fee if enabled (per kg)
          if (receptionFeeEnabled && selectedFactory?.receptionFee) {
            perKgFees += Number(selectedFactory.receptionFee) * Number(form.quantity);
          }
          
          // Add dispatch fee if enabled (per kg)
          if (dispatchFeeEnabled && selectedFactory?.dispatchFee) {
            perKgFees += Number(selectedFactory.dispatchFee) * Number(form.quantity);
          }
        }
        
        // Calculate subtotal before percentage fees
        const subtotal = baseCost + perKgFees;
        
        // Calculate percentage-based fees (applied to subtotal)
        let percentageFees = 0;
        if (form.productType === 'Frozen') {
          // Add environmental fee if enabled (percentage of subtotal)
          if (environmentalFeeEnabled && selectedFactory?.environmentalFeePercentage) {
            const envFeePercent = Number(selectedFactory.environmentalFeePercentage) / 100;
            percentageFees += subtotal * envFeePercent;
          }
          
          // Add electricity fee if enabled (percentage of subtotal)
          if (electricityFeeEnabled && selectedFactory?.electricityFeePercentage) {
            const elecFeePercent = Number(selectedFactory.electricityFeePercentage) / 100;
            percentageFees += subtotal * elecFeePercent;
          }
        }
        
        const total = subtotal + percentageFees;
        
        // Calculate individual percentage fees for display
        const environmentalFeeAmount = form.productType === 'Frozen' && environmentalFeeEnabled && selectedFactory?.environmentalFeePercentage 
          ? subtotal * (Number(selectedFactory.environmentalFeePercentage) / 100)
          : 0;
        
        const electricityFeeAmount = form.productType === 'Frozen' && electricityFeeEnabled && selectedFactory?.electricityFeePercentage 
          ? subtotal * (Number(selectedFactory.electricityFeePercentage) / 100)
          : 0;
        
        return {
          totalCost: total,
          environmentalFee: environmentalFeeAmount,
          electricityFee: electricityFeeAmount,
          receptionFee: receptionFeeEnabled && selectedFactory?.receptionFee ? Number(selectedFactory.receptionFee) : 0,
          dispatchFee: dispatchFeeEnabled && selectedFactory?.dispatchFee ? Number(selectedFactory.dispatchFee) : 0
        };
      };

      const calculatedValues = calculateTotalCost();
      return { ...form, ...calculatedValues };
    }));
  }, [
    palletChargeEnabled,
    terminalChargeEnabled,
    receptionFeeEnabled,
    dispatchFeeEnabled,
    environmentalFeeEnabled,
    electricityFeeEnabled,
    selectedFactory
  ]);

  // Handle form changes for each SKU with immediate cost recalculation
  const handleSKUFormChange = (skuId: string, field: string, value: any) => {
    setSkuForms(prev => prev.map(form => {
      if (form.id === skuId) {
        const updatedForm = { ...form, [field]: value };
        
        // When trim type changes, load RM specs and reset rmSpec
        if (field === 'trimType' && updatedForm.product && updatedForm.trimType && selectedFactory?.rateData) {
          const factoryRmSpecs = selectedFactory.rateData
            .filter(item => 
              item.product === updatedForm.product && 
              item.trim_type === updatedForm.trimType && 
              item.rm_spec
            )
            .map(item => item.rm_spec);
          
          const uniqueRmSpecs = Array.from(new Set(factoryRmSpecs.filter(Boolean))).sort();
          setRmSpecs(uniqueRmSpecs);
          
          // Reset rmSpec when trim type changes
          updatedForm.rmSpec = '';
          updatedForm.filletingRate = 0;
        }
        
        // Update filleting rate when product/trim/rm spec changes
        if ((field === 'product' || field === 'trimType' || field === 'rmSpec') && 
            updatedForm.product && updatedForm.trimType && updatedForm.rmSpec && selectedFactory?.rateData) {
          const rateData = selectedFactory.rateData.find(item => 
            item.product === updatedForm.product && 
            item.trim_type === updatedForm.trimType && 
            item.rm_spec === updatedForm.rmSpec
          );
          
          if (rateData) {
            console.log('Found filleting rate data:', rateData.rate_per_kg, 'for', updatedForm.product, updatedForm.trimType, updatedForm.rmSpec);
            updatedForm.filletingRate = rateData.rate_per_kg || 0;
    } else {
            console.log('No filleting rate found for:', updatedForm.product, updatedForm.trimType, updatedForm.rmSpec);
            updatedForm.filletingRate = 0;
          }
        }
        
        // Update packaging rate based on product type and product
        if ((field === 'product' || field === 'productType') && updatedForm.product && updatedForm.productType) {
          // When product or product type changes, reset packaging dependent fields
          updatedForm.boxQty = '';
          updatedForm.packagingType = '';
          updatedForm.transportMode = 'TBD';
          updatedForm.packagingRate = 0;
        }

        // When box quantity or packaging type is chosen, determine transport mode and packaging rate
        if ((field === 'boxQty' || field === 'packagingType') &&
            updatedForm.product && updatedForm.productType && selectedFactory?.packagingData) {
          const currentBox = field === 'boxQty' ? value : updatedForm.boxQty;
          const currentPack = field === 'packagingType' ? value : updatedForm.packagingType;

          const match = selectedFactory.packagingData.find(item =>
            item.product === updatedForm.product &&
            item.prod_type === updatedForm.productType &&
            item.box_qty === currentBox &&
            item.pack === currentPack
          );

          if (match) {
            updatedForm.transportMode = match.transport_mode || 'TBD';
            updatedForm.packagingRate = match.packaging_rate || 0;
          } else {
            updatedForm.transportMode = 'TBD';
            updatedForm.packagingRate = 0;
          }
        }
        
        // Update freezing rate based on freezing type
        if (field === 'freezingType' && updatedForm.freezingType && selectedFactory?.chargeRates) {
          // Try product-specific rate first (like NewEnquiry)
          let freezingRate = selectedFactory.chargeRates.find(rate => 
            (rate.charge_name === 'Freezing Rate' || 
             rate.charge_name === 'Tunnel Freezing Rate' || 
             rate.charge_name === 'Gyro Freezing Rate') &&
            rate.product_type === 'Frozen' &&
            rate.product === updatedForm.product &&
            rate.subtype === updatedForm.freezingType
          );

          // If no product-specific rate found, try without product constraint
          if (!freezingRate) {
            freezingRate = selectedFactory.chargeRates.find(rate => 
              (rate.charge_name === 'Freezing Rate' || 
               rate.charge_name === 'Tunnel Freezing Rate' || 
               rate.charge_name === 'Gyro Freezing Rate') &&
              rate.product_type === 'Frozen' &&
              rate.subtype === updatedForm.freezingType
            );
          }
          
          if (freezingRate) {
            console.log('Found freezing rate data:', freezingRate.rate_value, 'for', updatedForm.freezingType);
            updatedForm.freezingRate = Number(freezingRate.rate_value) || 0;
          } else {
            console.log('No freezing rate found for:', updatedForm.freezingType);
            updatedForm.freezingRate = 0;
          }
        }
        
        // Recalculate costs immediately when form changes
        const calculateTotalCost = () => {
          const packagingRate = Number(updatedForm.packagingRate || 0);
          const freezingRate = updatedForm.productType === 'Frozen' ? Number(updatedForm.freezingRate || 0) : 0;
          const filletingRate = Number(updatedForm.filletingRate || 0);
          
          const palletCharge = palletChargeEnabled ? Number(updatedForm.palletCharge || 0) : 0;
          const terminalCharge = terminalChargeEnabled ? Number(updatedForm.terminalCharge || 0) : 0;
          
          const baseUnitPrice = filletingRate + packagingRate + freezingRate + palletCharge + terminalCharge;
          const optionalTotal = updatedForm.optionalCharges.reduce((sum, charge) => sum + (charge.chargeValue || 0), 0);
          const baseCost = (baseUnitPrice * updatedForm.quantity) + optionalTotal;
          
          let perKgFees = 0;
          if (updatedForm.productType === 'Frozen') {
            if (receptionFeeEnabled && selectedFactory?.receptionFee) {
              perKgFees += Number(selectedFactory.receptionFee) * Number(updatedForm.quantity);
            }
            if (dispatchFeeEnabled && selectedFactory?.dispatchFee) {
              perKgFees += Number(selectedFactory.dispatchFee) * Number(updatedForm.quantity);
            }
          }
          
          const subtotal = baseCost + perKgFees;
          let percentageFees = 0;
          if (updatedForm.productType === 'Frozen') {
            if (environmentalFeeEnabled && selectedFactory?.environmentalFeePercentage) {
              percentageFees += subtotal * (Number(selectedFactory.environmentalFeePercentage) / 100);
            }
            if (electricityFeeEnabled && selectedFactory?.electricityFeePercentage) {
              percentageFees += subtotal * (Number(selectedFactory.electricityFeePercentage) / 100);
            }
          }
          
          return subtotal + percentageFees;
        };

        updatedForm.totalCost = calculateTotalCost();
        
        // Also update individual fee amounts for display
        updatedForm.environmentalFee = updatedForm.productType === 'Frozen' && environmentalFeeEnabled && selectedFactory?.environmentalFeePercentage 
          ? (Number(updatedForm.packagingRate || 0) + Number(updatedForm.filletingRate || 0) + Number(updatedForm.freezingRate || 0)) * updatedForm.quantity * (Number(selectedFactory.environmentalFeePercentage) / 100)
          : 0;
        updatedForm.electricityFee = updatedForm.productType === 'Frozen' && electricityFeeEnabled && selectedFactory?.electricityFeePercentage 
          ? (Number(updatedForm.packagingRate || 0) + Number(updatedForm.filletingRate || 0) + Number(updatedForm.freezingRate || 0)) * updatedForm.quantity * (Number(selectedFactory.electricityFeePercentage) / 100)
          : 0;
        updatedForm.receptionFee = receptionFeeEnabled && selectedFactory?.receptionFee ? Number(selectedFactory.receptionFee) : 0;
        updatedForm.dispatchFee = dispatchFeeEnabled && selectedFactory?.dispatchFee ? Number(selectedFactory.dispatchFee) : 0;
        
        return updatedForm;
      }
      return form;
    }));
  };

  // Handle factory change
  const handleFactoryChange = (event: SelectChangeEvent) => {
    const factoryId = parseInt(event.target.value);
    const factory = factories.find(f => f.id === factoryId);
    setSelectedFactory(factory || null);
  };

  // Toggle handlers (exactly like NewEnquiry)
  const handleTogglePalletCharge = (enabled: boolean) => setPalletChargeEnabled(enabled);
  const handleToggleTerminalCharge = (enabled: boolean) => setTerminalChargeEnabled(enabled);
  const handleToggleReceptionFee = (enabled: boolean) => setReceptionFeeEnabled(enabled);
  const handleToggleDispatchFee = (enabled: boolean) => setDispatchFeeEnabled(enabled);
  const handleToggleEnvironmentalFee = (enabled: boolean) => setEnvironmentalFeeEnabled(enabled);
  const handleToggleElectricityFee = (enabled: boolean) => setElectricityFeeEnabled(enabled);
  const handleToggleProdAB = (enabled: boolean) => setProdABEnabled(enabled);
  const handleToggleDescaling = (enabled: boolean) => setDescalingEnabled(enabled);
  const handleTogglePortionSkinOn = (enabled: boolean) => setPortionSkinOnEnabled(enabled);
  const handleTogglePortionSkinOff = (enabled: boolean) => setPortionSkinOffEnabled(enabled);

  // Generate quote
  const handleGenerateQuote = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AuthService.getCurrentUser()?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enquiryId: emailEnquiry?.enquiryId || enquiryId,
          skuForms: skuForms.map(form => ({
            productDescription: form.productDescription,
            quantity: form.quantity,
            totalCost: form.totalCost,
            product: form.product,
            trimType: form.trimType,
            rmSpec: form.rmSpec,
            productType: form.productType,
            packagingType: form.packagingType
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate quote');
      }

      const data = await response.json();
      
      // Navigate to quotes page or show success message
      navigate('/quotes', { 
        state: { 
          message: `Quote ${data.quoteNumber} generated successfully!`,
          quoteId: data.quote?.id 
        }
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to generate quote');
    } finally {
      setGenerating(false);
    }
  };

  // Add new item function
  const handleAddItem = () => {
    const newItem: SKUFormData = {
      id: `new-${Date.now()}`,
      customerSkuReference: '',
      productDescription: 'New Item',
      requestedQuantity: 0,
      deliveryRequirement: 'TBD',
      specialInstructions: '',
      
      // AI-parsed fields (empty for new items)
      aiParsedProductType: 'Manual Entry',
      aiParsedProduct: 'Manual Entry',
      aiParsedTrimType: 'Manual Entry',
      aiParsedPackagingType: 'Manual Entry',
      aiParsedBoxQty: 'Manual Entry',
      aiParsedProductCut: 'Manual Entry',
      
      // Form fields
      productType: productTypes[0] || 'FROZEN',
      product: products[0] || 'Fillet',
      trimType: trimTypes[0] || 'A',
      rmSpec: rmSpecs[0] || '1-2 kg',
      yieldValue: 0,
      freezingType: '',
      isStorageRequired: false,
      numberOfWeeks: 1.0,
      boxQty: '',
      packagingType: '',
      transportMode: '',
      quantity: 100, // Default 100 kg
      
      // Calculated rates
      packagingRate: 0,
      palletCharge: 0,
      terminalCharge: 0,
      freezingRate: 0,
      filletingRate: 0,
      totalCost: 0,
      receptionFee: 0,
      dispatchFee: 0,
      environmentalFee: 0,
      electricityFee: 0,
      
      // Optional charges
      optionalCharges: [] as Array<{chargeValue: number}>
    };

    setSkuForms(prev => [newItem, ...prev]);
  };

  // Delete item function
  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      setSkuForms(prev => prev.filter(item => item.id !== itemToDelete));
      setItemToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const cancelDelete = () => {
    setItemToDelete(null);
    setDeleteConfirmOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!emailEnquiry) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>
          Enquiry not found
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Header 
        title="Generate Quote" 
        showBackButton={true}
        backPath="/email-enquiry-dashboard"
        onBack={() => navigate('/email-enquiry-dashboard')}
      />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Enquiry Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" gutterBottom>
                Quote Generation for {emailEnquiry.enquiryId}
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Customer: {emailEnquiry.customer?.contactPerson} ({emailEnquiry.customer?.companyName})
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Subject: {emailEnquiry.subject}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Chip 
                  label={`${emailEnquiry.enquiryItems.length} SKU${emailEnquiry.enquiryItems.length !== 1 ? 's' : ''}`}
                  color="primary" 
                />
                <Chip 
                  label={emailEnquiry.status}
                  color="secondary" 
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Factory Selection */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Factory Selection
          </Typography>
          <FormControl fullWidth sx={{ maxWidth: 300 }}>
            <InputLabel>Select Factory</InputLabel>
            <Select
              value={selectedFactory?.id?.toString() || ''}
              label="Select Factory"
              onChange={handleFactoryChange}
            >
              {factories.map((factory) => (
                <MenuItem key={factory.id} value={factory.id.toString()}>
                  {factory.name} ({factory.location})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* Email Content */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="primary" />
              <Typography variant="h6">
                Original Email Content
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setEmailContentVisible(!emailContentVisible)}
              endIcon={emailContentVisible ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {emailContentVisible ? 'Hide' : 'Show'} Email
            </Button>
          </Box>
          
          <Collapse in={emailContentVisible}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                From: {emailEnquiry.fromEmail}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Subject: {emailEnquiry.subject}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Date: {new Date(emailEnquiry.receivedAt).toLocaleString()}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Paper sx={{ p: 2, bgcolor: '#f9f9f9', maxHeight: 400, overflow: 'auto' }}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                  {emailEnquiry.emailBody || 'No email content available'}
                </Typography>
              </Paper>
            </Box>
          </Collapse>
        </Paper>

        {/* Add Item Button */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            size="large"
          >
            Add New Item
          </Button>
        </Paper>

        {/* SKU Forms - Each SKU gets the exact NewEnquiry structure */}
        {skuForms.map((skuForm, index) => (
            <Accordion key={skuForm.id} defaultExpanded={index === 0} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Typography variant="h6">
                    SKU #{index + 1}: {skuForm.productDescription || 'No Reference'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip 
                        label={`${skuForm.requestedQuantity.toLocaleString()} kg`}
                        color="primary"
                        size="small"
                      />
                    {skuForms.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(skuForm.id);
                        }}
                        title="Delete Item"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
            <AccordionDetails>
              {/* Exact NewEnquiry structure for each SKU */}
              <Grid container spacing={4}>
                {/* Left Column - Form */}
                <Grid item xs={12} lg={8}>
                  <Paper sx={{ p: 3 }}>
                    {/* AI-Parsed Fields */}
                    <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        🧠 AI-Parsed Fields:
                    </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip label={`Product Type: ${skuForm.aiParsedProductType}`} variant="outlined" />
                        <Chip label={`Product Cut: ${skuForm.aiParsedProductCut}`} variant="outlined" />
                        <Chip label={`Trim: ${skuForm.aiParsedTrimType}`} variant="outlined" />
                        <Chip label={`RM Spec: ${skuForm.rmSpec}`} variant="outlined" />
                        <Chip label={`Packaging: ${skuForm.aiParsedPackagingType}`} variant="outlined" />
                        <Chip label={`Box Qty: ${skuForm.aiParsedBoxQty}`} variant="outlined" />
                          </Box>
                        
                        {skuForm.specialInstructions && (
                            <Typography variant="body2" sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                              <strong>Special Instructions:</strong> {skuForm.specialInstructions}
                            </Typography>
                        )}
                    </Box>

                    {selectedFactory ? (
                      <Grid container spacing={3}>
                        {/* Quantity Field */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Quantity (kg)"
                            type="number"
                            value={skuForm.quantity}
                            onChange={(e) => handleSKUFormChange(skuForm.id, 'quantity', parseFloat(e.target.value) || 0)}
                            size="medium"
                            sx={{ 
                              height: '56px', 
                              minWidth: '200px',
                              '& .MuiInputBase-root': { 
                                height: '56px',
                                display: 'flex', 
                                alignItems: 'center' 
                              }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                        </Grid>

                        {/* Product Information followed by Packaging Details (stacked) */}
                        <Grid item xs={12}>
                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <Grid container spacing={2}>
                        <ProductInformation
                          productTypes={productTypes}
                          products={products}
                          trimTypes={trimTypes}
                          rmSpecs={rmSpecs}
                          productType={skuForm.productType}
                          product={skuForm.product}
                          trimType={skuForm.trimType}
                          rmSpec={skuForm.rmSpec}
                          yieldValue={skuForm.yieldValue}
                          freezingType={skuForm.freezingType}
                                  isStorageRequired={skuForm.isStorageRequired}
                                  numberOfWeeks={skuForm.numberOfWeeks}
                          isSubmitting={false}
                                  onProductTypeChange={(value) => handleSKUFormChange(skuForm.id, 'productType', value)}
                                  onProductChange={(value) => handleSKUFormChange(skuForm.id, 'product', value)}
                                  onTrimTypeChange={(value) => handleSKUFormChange(skuForm.id, 'trimType', value)}
                                  onRmSpecChange={(value) => handleSKUFormChange(skuForm.id, 'rmSpec', value)}
                                  onYieldValueChange={(value) => handleSKUFormChange(skuForm.id, 'yieldValue', value)}
                                  onFreezingTypeChange={(value) => handleSKUFormChange(skuForm.id, 'freezingType', value)}
                                  onStorageRequiredChange={(value) => handleSKUFormChange(skuForm.id, 'isStorageRequired', value)}
                                  onNumberOfWeeksChange={(value) => handleSKUFormChange(skuForm.id, 'numberOfWeeks', value)}
                                />
                              </Grid>
                            </Grid>
                            <Grid item xs={12}>
                              <Grid container spacing={2}>
                          <PackagingDetails
                            product={skuForm.product}
                            productType={skuForm.productType}
                            boxQty={skuForm.boxQty}
                            packagingType={skuForm.packagingType}
                            transportMode={skuForm.transportMode}
                                  packagingRate={Number(skuForm.packagingRate) || 0}
                                  palletCharge={Number(skuForm.palletCharge) || 0}
                                  terminalCharge={Number(skuForm.terminalCharge) || 0}
                            isSubmitting={false}
                                  quantity={Number(skuForm.quantity) || 0}
                                  onBoxQtyChange={(value) => handleSKUFormChange(skuForm.id, 'boxQty', value)}
                                  onPackagingTypeChange={(value) => handleSKUFormChange(skuForm.id, 'packagingType', value)}
                                  onPackagingRateChange={(value) => handleSKUFormChange(skuForm.id, 'packagingRate', value)}
                                  onPalletChargeChange={(value) => handleSKUFormChange(skuForm.id, 'palletCharge', value)}
                                  onTerminalChargeChange={(value) => handleSKUFormChange(skuForm.id, 'terminalCharge', value)}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    ) : (
                      <Alert severity="info" sx={{ mt: 3 }}>
                        Please select a factory to configure product details.
                      </Alert>
                    )}
                  </Paper>
                </Grid>

                {/* Right Column - Cost Summary (Exact same as NewEnquiry) */}
                <Grid item xs={12} lg={4}>
                  {selectedFactory ? (
                    <CostSummary
                      selectedFactory={selectedFactory}
                      filletingRate={Number(skuForm.filletingRate) || 0}
                      quantity={Number(skuForm.quantity) || 0}
                      yieldValue={Number(skuForm.yieldValue) || 0}
                      packagingRate={Number(skuForm.packagingRate) || 0}
                      filingRate={0}
                      palletCharge={Number(skuForm.palletCharge) || 0}
                      terminalCharge={Number(skuForm.terminalCharge) || 0}
                      freezingRate={Number(skuForm.freezingRate) || 0}
                      freezingType={skuForm.freezingType}
                      productType={skuForm.productType}
                      optionalCharges={[]}
                      totalCharges={Number(skuForm.totalCost) || 0}
                      product={skuForm.product}
                      onTogglePalletCharge={handleTogglePalletCharge}
                      onToggleTerminalCharge={handleToggleTerminalCharge}
                      palletChargeEnabled={palletChargeEnabled}
                      terminalChargeEnabled={terminalChargeEnabled}
                      // Freezing charges
                      receptionFeeEnabled={receptionFeeEnabled}
                      dispatchFeeEnabled={dispatchFeeEnabled}
                      environmentalFeeEnabled={environmentalFeeEnabled}
                      electricityFeeEnabled={electricityFeeEnabled}
                      onToggleReceptionFee={handleToggleReceptionFee}
                      onToggleDispatchFee={handleToggleDispatchFee}
                      onToggleEnvironmentalFee={handleToggleEnvironmentalFee}
                      onToggleElectricityFee={handleToggleElectricityFee}
                      isStorageRequired={skuForm.isStorageRequired}
                      numberOfWeeks={skuForm.numberOfWeeks}
                      // Optional processing charges
                      prodABEnabled={prodABEnabled}
                      descalingEnabled={descalingEnabled}
                      portionSkinOnEnabled={portionSkinOnEnabled}
                      portionSkinOffEnabled={portionSkinOffEnabled}
                      onToggleProdAB={handleToggleProdAB}
                      onToggleDescaling={handleToggleDescaling}
                      onTogglePortionSkinOn={handleTogglePortionSkinOn}
                      onTogglePortionSkinOff={handleTogglePortionSkinOff}
                    />
                  ) : (
                    <Alert severity="info">
                      Please select a factory to see cost summary.
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

      {/* Generate Quote Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateQuote}
            disabled={generating || !selectedFactory}
            sx={{ minWidth: 200 }}
          >
            {generating ? <CircularProgress size={20} /> : 'Generate Quote'}
          </Button>
        </Box>
    </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this item from the quote? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteItem} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuoteGeneration;