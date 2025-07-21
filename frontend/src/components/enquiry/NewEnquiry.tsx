// This file contains the NewEnquiry component
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  AppBar, 
  Toolbar, 
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFactory, Factory, ChargeRateOption } from '../../context/FactoryContext';
import { CostSummary } from './CostSummary';
import { ProductInformation } from './ProductInformation';
import { PackagingDetails } from './PackagingDetails';
import { OptionalCharges, OptionalCharge } from './OptionalCharges';
import { FilletingRateCalculator } from './FilletingRateCalculator';
import Header from '../layout/Header';


// Types
interface EnquiryData {
  factory: Factory | null;
  product: string;
  productType: string;
  freezingType: string;
  rmSpec: string;
  trimType: string;
  yieldValue: number;
  boxQty: string;
  packagingType: string;
  transportMode: string;
  packagingRate: number;
  filingRate: number;
  palletCharge: number;
  terminalCharge: number;
  freezingRate: number;
  optionalCharges: OptionalCharge[];
  enablePalletCharge: boolean;
  enableSkagerrakHandling: boolean;
  filletingRate: number;
  quantity: number;
  totalCost: number;
  receptionFee: number;
  dispatchFee: number;
  environmentalFee: number;
  electricityFee: number;
}

// Initial state
const initialEnquiryState: EnquiryData = {
  factory: null,
  product: '',
  productType: '',
  freezingType: '',
  rmSpec: '',
  trimType: '',
  yieldValue: 0,
  boxQty: '',
  packagingType: '',
  transportMode: '',
  packagingRate: 0,
  filingRate: 0,
  palletCharge: 0,
  terminalCharge: 0,
  freezingRate: 0,
  optionalCharges: [],
  enablePalletCharge: true,
  enableSkagerrakHandling: true,
  filletingRate: 0,
  quantity: 1,
  totalCost: 0,
  receptionFee: 0,
  dispatchFee: 0,
  environmentalFee: 0,
  electricityFee: 0
};

// Main Component
const NewEnquiry: React.FC = () => {
  // Hooks
  const { user, logout } = useAuth();
  const { factories, selectedFactory, setSelectedFactory, getChargeRates } = useFactory();
  const navigate = useNavigate();

  // State
  const [enquiryData, setEnquiryData] = useState<EnquiryData>(initialEnquiryState);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [trimTypes, setTrimTypes] = useState<string[]>([]);
  const [rmSpecs, setRmSpecs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prodABEnabled, setProdABEnabled] = useState(false);
  const [descalingEnabled, setDescalingEnabled] = useState(false);
  const [palletChargeEnabled, setPalletChargeEnabled] = useState(true);
  const [terminalChargeEnabled, setTerminalChargeEnabled] = useState(true);
  const [portionSkinOnEnabled, setPortionSkinOnEnabled] = useState(false);
  const [portionSkinOffEnabled, setPortionSkinOffEnabled] = useState(false);
  const [receptionFeeEnabled, setReceptionFeeEnabled] = useState(false);
  const [dispatchFeeEnabled, setDispatchFeeEnabled] = useState(false);
  const [environmentalFeeEnabled, setEnvironmentalFeeEnabled] = useState(false);
  const [electricityFeeEnabled, setElectricityFeeEnabled] = useState(false);
  
  // Add state for charge rates
  const [chargeRates, setChargeRates] = useState<ChargeRateOption[]>([]);
  
  // Load charge rates when factory changes
  useEffect(() => {
    if (selectedFactory?.chargeRates) {
      setChargeRates(selectedFactory.chargeRates);
      console.log('Loaded charge rates:', selectedFactory.chargeRates);
    } else {
      setChargeRates([]);
    }
  }, [selectedFactory]);

  // Update factory when selected factory changes
  useEffect(() => {
    setEnquiryData(prev => ({ 
      ...prev, 
      factory: selectedFactory,
      // Set palletCharge and terminalCharge from the factory's values
      palletCharge: selectedFactory?.palletCharge || 0,
      terminalCharge: selectedFactory?.terminalCharge || 0,
      // Set new fees from factory values
      receptionFee: 0,
      dispatchFee: 0,
      environmentalFee: 0,
      electricityFee: 0
    }));
    if (selectedFactory) {
      resetDependentFields();
    }
  }, [selectedFactory]);

  // Load product types from factory data
  useEffect(() => {
    console.log('DEBUG: Loading product types, selectedFactory:', selectedFactory);
    if (selectedFactory) {
      console.log('DEBUG: Factory structure:', {
        id: selectedFactory.id,
        name: selectedFactory.name,
        location: selectedFactory.location,
        hasPackagingData: !!selectedFactory.packagingData,
        packagingDataLength: selectedFactory.packagingData ? selectedFactory.packagingData.length : 0,
        hasRateData: !!selectedFactory.rateData,
        rateDataLength: selectedFactory.rateData ? selectedFactory.rateData.length : 0
      });
    }
    
    if (selectedFactory?.packagingData && selectedFactory.packagingData.length > 0) {
      console.log('Loading product types from factory data:', selectedFactory.packagingData);
      const uniqueProductTypes = Array.from(
        new Set(selectedFactory.packagingData.map(p => p.prod_type).filter(Boolean))
      ).sort();
      console.log('Extracted product types:', uniqueProductTypes);
      setProductTypes(uniqueProductTypes);
      updateProductType(uniqueProductTypes);
    } else {
      console.warn('No packaging data found in factory:', selectedFactory);
      setProductTypes([]);
      resetDependentFields();
    }
  }, [selectedFactory]);

  // Load products when product type changes
  useEffect(() => {
    if (enquiryData.productType && selectedFactory) {
      const factoryProducts = getFactoryProducts();
      console.log('Loading products for product type:', enquiryData.productType, factoryProducts);
      const uniqueProducts = Array.from(new Set(factoryProducts.filter(Boolean))).sort();
      console.log('Extracted unique products:', uniqueProducts);
      setProducts(uniqueProducts);
      updateProduct(uniqueProducts);
    } else {
      setProducts([]);
      resetProductFields();
    }
  }, [enquiryData.productType, selectedFactory]);

  // Load RM specs when trim type changes
  useEffect(() => {
    if (enquiryData.product && enquiryData.trimType && selectedFactory?.rateData) {
      const factoryRmSpecs = selectedFactory.rateData
        .filter(item => 
          item.product === enquiryData.product && 
          item.trim_type === enquiryData.trimType && 
          item.rm_spec
        )
        .map(item => item.rm_spec);
        
      const uniqueRmSpecs = Array.from(new Set(factoryRmSpecs.filter(Boolean))).sort();
      setRmSpecs(uniqueRmSpecs);
      updateRmSpec(uniqueRmSpecs);
    } else {
      setRmSpecs([]);
      setEnquiryData(prev => ({ ...prev, rmSpec: '' }));
    }
  }, [enquiryData.product, enquiryData.trimType, selectedFactory]);

  // Update base rate when RM spec changes
  useEffect(() => {
    if (enquiryData.product && enquiryData.trimType && enquiryData.rmSpec && selectedFactory?.rateData) {
      // Find the matching rate data for the current specifications
      const rateData = selectedFactory.rateData.find(item => 
        item.product === enquiryData.product && 
        item.trim_type === enquiryData.trimType && 
        item.rm_spec === enquiryData.rmSpec
      );
      
      // Update the base rate if found
      if (rateData) {
        console.log('Found rate data with rate per kg:', rateData.rate_per_kg);
        setEnquiryData(prev => ({ 
          ...prev, 
          filletingRate: rateData.rate_per_kg || 0 
        }));
      } else {
        console.log('No rate data found for selected specifications');
        setEnquiryData(prev => ({ ...prev, filletingRate: 0 }));
      }
    }
  }, [enquiryData.product, enquiryData.trimType, enquiryData.rmSpec, selectedFactory]);

  // Calculate total cost
  useEffect(() => {
    const total = calculateTotalCost();
    setEnquiryData(prev => ({ ...prev, totalCost: total }));
  }, [
    enquiryData.filletingRate,
    enquiryData.quantity,
    enquiryData.yieldValue,
    enquiryData.packagingRate,
    enquiryData.filingRate,
    enquiryData.palletCharge,
    enquiryData.terminalCharge,
    enquiryData.freezingRate,
    enquiryData.productType,
    enquiryData.optionalCharges
  ]);

  // Load trim types when product changes
  useEffect(() => {
    console.log('DEBUG: Loading trim types for product:', enquiryData.product);
    console.log('DEBUG: Factory rate data:', selectedFactory?.rateData);
    
    if (enquiryData.product && selectedFactory?.rateData) {
      const factoryTrimTypes = selectedFactory.rateData
        .filter(item => {
          console.log('DEBUG: Checking rate data item for trim:', item);
          return item.product === enquiryData.product && item.trim_type;
        })
        .map(item => item.trim_type);
      
      console.log('DEBUG: Extracted trim types:', factoryTrimTypes);
      const uniqueTrimTypes = Array.from(new Set(factoryTrimTypes.filter(Boolean))).sort();
      console.log('DEBUG: Unique trim types:', uniqueTrimTypes);
      setTrimTypes(uniqueTrimTypes);
      updateTrimType(uniqueTrimTypes);
    } else {
      console.log('DEBUG: Cannot load trim types - missing product or rate data');
      setTrimTypes([]);
      resetTrimFields();
    }
  }, [enquiryData.product, selectedFactory]);

  // Helper functions
  const resetDependentFields = () => {
    setEnquiryData(prev => ({
      ...prev,
      productType: '',
      product: '',
      trimType: '',
      rmSpec: '',
      boxQty: '',
      packagingType: '',
      transportMode: '',
      filletingRate: 0,
      packagingRate: 0,
    }));
    setProductTypes([]);
    setProducts([]);
    setTrimTypes([]);
    setRmSpecs([]);
  };

  const resetProductFields = () => {
    setEnquiryData(prev => ({
      ...prev,
      product: '',
      trimType: '',
      rmSpec: '',
      boxQty: '',
      packagingType: '',
      transportMode: '',
      filletingRate: 0,
      packagingRate: 0,
    }));
  };

  const resetTrimFields = () => {
    setEnquiryData(prev => ({
      ...prev,
      trimType: '',
      rmSpec: '',
      filletingRate: 0,
    }));
  };

  const getFactoryProducts = () => {
    let factoryProducts: string[] = [];
    console.log('Selected factory changed, checking packaging data:', selectedFactory);
    if (selectedFactory?.packagingData) {
      console.log('Factory packaging data found:', selectedFactory.packagingData);
      factoryProducts = factoryProducts.concat(
        selectedFactory.packagingData
          .filter(item => item.prod_type === enquiryData.productType && item.product)
          .map(item => item.product)
      );
    }
    if (selectedFactory?.rateData) {
      const rateTableProducts = selectedFactory.rateData
        .filter(item => item.product)
        .map(item => item.product);
      factoryProducts = factoryProducts.concat(rateTableProducts);
    }
    return factoryProducts;
  };

  const updateProductType = (uniqueProductTypes: string[]) => {
    if (uniqueProductTypes.length === 1) {
      setEnquiryData(prev => ({ ...prev, productType: uniqueProductTypes[0] }));
    } else if (!uniqueProductTypes.includes(enquiryData.productType)) {
      setEnquiryData(prev => ({ ...prev, productType: '' }));
    }
  };

  const updateProduct = (uniqueProducts: string[]) => {
    if (uniqueProducts.length === 1) {
      setEnquiryData(prev => ({ ...prev, product: uniqueProducts[0] }));
    } else if (!uniqueProducts.includes(enquiryData.product)) {
      setEnquiryData(prev => ({ ...prev, product: '' }));
    }
  };

  const updateTrimType = (uniqueTrimTypes: string[]) => {
    if (uniqueTrimTypes.length === 1) {
      setEnquiryData(prev => ({ ...prev, trimType: uniqueTrimTypes[0] }));
    } else if (!uniqueTrimTypes.includes(enquiryData.trimType)) {
      setEnquiryData(prev => ({ ...prev, trimType: '' }));
    }
  };

  const updateRmSpec = (uniqueRmSpecs: string[]) => {
    if (uniqueRmSpecs.length === 1) {
      setEnquiryData(prev => ({ ...prev, rmSpec: uniqueRmSpecs[0] }));
    } else if (!uniqueRmSpecs.includes(enquiryData.rmSpec)) {
      setEnquiryData(prev => ({ ...prev, rmSpec: '' }));
    }
  };

  const calculateTotalCost = () => {
    console.log("FEE-DEBUG: Fee calculation info:", {
      productType: enquiryData.productType,
      receptionFeeEnabled,
      dispatchFeeEnabled,
      environmentalFeeEnabled,
      electricityFeeEnabled,
      factoryFees: {
        receptionFee: selectedFactory?.receptionFee,
        dispatchFee: selectedFactory?.dispatchFee, 
        environmentalFeePercentage: selectedFactory?.environmentalFeePercentage,
        electricityFeePercentage: selectedFactory?.electricityFeePercentage
      }
    });
    
    // No yield factor in main calculation
    const filletingAmount = Number(enquiryData.filletingRate || 0);
    const packageAmount = Number(enquiryData.packagingRate || 0);
    const additionalCharges = 
      Number(enquiryData.filingRate || 0) + 
      (palletChargeEnabled ? Number(enquiryData.palletCharge || 0) : 0) + 
      (terminalChargeEnabled ? Number(enquiryData.terminalCharge || 0) : 0);
    
    const freezingCharge = 
      enquiryData.productType === 'Frozen' && enquiryData.freezingRate > 0 
        ? Number(enquiryData.freezingRate || 0)
        : 0;
    
    const optionalTotal = enquiryData.optionalCharges.reduce(
      (sum, charge) => sum + Number(charge.chargeValue || 0), 0
    );

    // Add the new fees for frozen products
    let frozenFees = 0;
    if (enquiryData.productType === 'Frozen') {
      // Add reception fee if enabled
      if (receptionFeeEnabled && selectedFactory?.receptionFee) {
        frozenFees += Number(selectedFactory.receptionFee);
      }
      
      // Add dispatch fee if enabled 
      if (dispatchFeeEnabled && selectedFactory?.dispatchFee) {
        frozenFees += Number(selectedFactory.dispatchFee);
      }
    }
    
    // Calculate subtotal before percentage fees
    const subtotal = filletingAmount + packageAmount + additionalCharges + optionalTotal + freezingCharge + frozenFees;
    
    // Calculate environmental and electricity fees (based on percentage)
    let percentageFees = 0;
    if (enquiryData.productType === 'Frozen') {
      // Add environmental fee if enabled
      if (environmentalFeeEnabled && selectedFactory?.environmentalFeePercentage) {
        const envFeePercent = Number(selectedFactory.environmentalFeePercentage) / 100;
        percentageFees += subtotal * envFeePercent;
      }
      
      // Add electricity fee if enabled
      if (electricityFeeEnabled && selectedFactory?.electricityFeePercentage) {
        const elecFeePercent = Number(selectedFactory.electricityFeePercentage) / 100;
        percentageFees += subtotal * elecFeePercent;
      }
    }
    
    const total = subtotal + percentageFees;
    console.log("FEE-DEBUG: Fee calculation result:", {
      frozenFees,
      percentageFees,
      total
    });
    
    return total;
  };

  // Helper functions to find charge rates
  const findChargeRate = (chargeName: string, productType: string, product: string, subtype?: string): number => {
    if (!chargeRates || chargeRates.length === 0) {
      console.warn(`No charge rates found, using fallback value for ${chargeName}`);
      // Return fallback values for common charges
      switch(chargeName) {
        case 'Prod A/B': return 1.00;
        case 'Descaling': return 1.50;
        case 'Portion Skin On': return 2.50;
        case 'Portion Skin Off': return 3.00;
        default: return 0;
      }
    }
    
    // Find the matching charge rate
    let chargeRate = chargeRates.find(cr => 
      cr.charge_name === chargeName && 
      (cr.product_type === productType || cr.product_type === '*') && 
      (cr.product === product || cr.product === '*') &&
      (!subtype || cr.subtype === subtype || cr.subtype === '*')
    );
    
    // If no exact match, try to find a more generic one (with wildcards)
    if (!chargeRate) {
      chargeRate = chargeRates.find(cr => 
        cr.charge_name === chargeName && 
        (cr.product_type === '*' || cr.product_type === productType) && 
        (cr.product === '*' || cr.product === product)
      );
    }
    
    console.log(`Charge rate for ${chargeName} (${productType}, ${product}, ${subtype}):`, 
      chargeRate ? chargeRate.rate_value : 'Not found, using fallback');
    
    // Return the rate value if found, otherwise return fallback values
    if (chargeRate) {
      return chargeRate.rate_value;
    }
    
    // Fallback values
    switch(chargeName) {
      case 'Prod A/B': return 1.00;
      case 'Descaling': return 1.50;
      case 'Portion Skin On': return 2.50;
      case 'Portion Skin Off': return 3.00;
      default: return 0;
    }
  };

  // Toggle handler for Prod A/B optional charge
  const handleToggleProdAB = (isChecked: boolean) => {
    setProdABEnabled(isChecked);
    
    if (isChecked) {
      // Add the charge if it doesn't exist
      const currencySymbol = selectedFactory?.currency || '$';
      const existingIndex = enquiryData.optionalCharges.findIndex(
        charge => charge.chargeName === `Prod A/B (${currencySymbol}1.00 per kg RM)`
      );
      
      if (existingIndex === -1) {
        // Calculate charge using the new formula: (rate/yield value)*100
        const prodABRate = 1.00;
        const chargeValue = enquiryData.yieldValue > 0 
          ? (prodABRate / enquiryData.yieldValue) * 100 
          : prodABRate;
          
        const newCharges = [...enquiryData.optionalCharges];
        newCharges.push({
          chargeName: `Prod A/B (${currencySymbol}1.00 per kg RM)`,
          chargeValue: chargeValue
        });
        setEnquiryData(prev => ({
          ...prev,
          optionalCharges: newCharges
        }));
      }
    } else {
      // Remove the charge if it exists
      const currencySymbol = selectedFactory?.currency || '$';
      const existingIndex = enquiryData.optionalCharges.findIndex(
        charge => charge.chargeName === `Prod A/B (${currencySymbol}1.00 per kg RM)`
      );
      
      if (existingIndex !== -1) {
        const newCharges = [...enquiryData.optionalCharges];
        newCharges.splice(existingIndex, 1);
        setEnquiryData(prev => ({
          ...prev,
          optionalCharges: newCharges
        }));
      }
    }
  };

  // Toggle handler for Descaling optional charge
  const handleToggleDescaling = (isChecked: boolean) => {
    setDescalingEnabled(isChecked);
    
    if (isChecked) {
      // Add the charge if it doesn't exist
      const currencySymbol = selectedFactory?.currency || '$';
      const existingIndex = enquiryData.optionalCharges.findIndex(
        charge => charge.chargeName === `Descaling (${currencySymbol}1.50 per kg RM)`
      );
      
      if (existingIndex === -1) {
        // Calculate charge using the new formula: (rate/yield value)*100
        const descalingRate = 1.50;
        const chargeValue = enquiryData.yieldValue > 0 
          ? (descalingRate / enquiryData.yieldValue) * 100 
          : descalingRate;
          
        const newCharges = [...enquiryData.optionalCharges];
        newCharges.push({
          chargeName: `Descaling (${currencySymbol}1.50 per kg RM)`,
          chargeValue: chargeValue
        });
        setEnquiryData(prev => ({
          ...prev,
          optionalCharges: newCharges
        }));
      }
    } else {
      // Remove the charge if it exists
      const currencySymbol = selectedFactory?.currency || '$';
      const existingIndex = enquiryData.optionalCharges.findIndex(
        charge => charge.chargeName === `Descaling (${currencySymbol}1.50 per kg RM)`
      );
      
      if (existingIndex !== -1) {
        const newCharges = [...enquiryData.optionalCharges];
        newCharges.splice(existingIndex, 1);
        setEnquiryData(prev => ({
          ...prev,
          optionalCharges: newCharges
        }));
      }
    }
  };

  // Toggle handler for Portion Skin On
  const handleTogglePortionSkinOn = (isChecked: boolean) => {
    setPortionSkinOnEnabled(isChecked);
    
    if (isChecked) {
      // If turning on Skin On, turn off Skin Off
      if (portionSkinOffEnabled) {
        setPortionSkinOffEnabled(false);
        
        // Remove Skin Off charge if it exists
        const skinOffIndex = enquiryData.optionalCharges.findIndex(
          charge => charge.chargeName.includes('Portion Skin Off')
        );
        
        if (skinOffIndex !== -1) {
          const newCharges = [...enquiryData.optionalCharges];
          newCharges.splice(skinOffIndex, 1);
          setEnquiryData(prev => ({
            ...prev,
            optionalCharges: newCharges
          }));
        }
      }
      
      // Get the charge rate from the factory charge rates
      const portionSkinOnRate = findChargeRate('Portion Skin On', enquiryData.productType, 'Portions');
      
      // Add the charge if it doesn't exist
      const currencySymbol = selectedFactory?.currency || '$';
      const existingIndex = enquiryData.optionalCharges.findIndex(
        charge => charge.chargeName.includes('Portion Skin On')
      );
      
      if (existingIndex === -1) {
        const newCharges = [...enquiryData.optionalCharges];
        newCharges.push({
          chargeName: `Portion Skin On (${currencySymbol}${portionSkinOnRate.toFixed(2)} per kg)`,
          chargeValue: portionSkinOnRate
        });
        setEnquiryData(prev => ({
          ...prev,
          optionalCharges: newCharges
        }));
      }
    } else {
      // Remove the charge if it exists
      const existingIndex = enquiryData.optionalCharges.findIndex(
        charge => charge.chargeName.includes('Portion Skin On')
      );
      
      if (existingIndex !== -1) {
        const newCharges = [...enquiryData.optionalCharges];
        newCharges.splice(existingIndex, 1);
        setEnquiryData(prev => ({
          ...prev,
          optionalCharges: newCharges
        }));
      }
    }
  };

  // Toggle handler for Portion Skin Off
  const handleTogglePortionSkinOff = (isChecked: boolean) => {
    setPortionSkinOffEnabled(isChecked);
    
    if (isChecked) {
      // If turning on Skin Off, turn off Skin On
      if (portionSkinOnEnabled) {
        setPortionSkinOnEnabled(false);
        
        // Remove Skin On charge if it exists
        const skinOnIndex = enquiryData.optionalCharges.findIndex(
          charge => charge.chargeName.includes('Portion Skin On')
        );
        
        if (skinOnIndex !== -1) {
          const newCharges = [...enquiryData.optionalCharges];
          newCharges.splice(skinOnIndex, 1);
          setEnquiryData(prev => ({
            ...prev,
            optionalCharges: newCharges
          }));
        }
      }
      
      // Get the charge rate from the factory charge rates
      const portionSkinOffRate = findChargeRate('Portion Skin Off', enquiryData.productType, 'Portions');
      
      // Add the charge if it doesn't exist
      const currencySymbol = selectedFactory?.currency || '$';
      const existingIndex = enquiryData.optionalCharges.findIndex(
        charge => charge.chargeName.includes('Portion Skin Off')
      );
      
      if (existingIndex === -1) {
        const newCharges = [...enquiryData.optionalCharges];
        newCharges.push({
          chargeName: `Portion Skin Off (${currencySymbol}${portionSkinOffRate.toFixed(2)} per kg)`,
          chargeValue: portionSkinOffRate
        });
        setEnquiryData(prev => ({
          ...prev,
          optionalCharges: newCharges
        }));
      }
    } else {
      // Remove the charge if it exists
      const existingIndex = enquiryData.optionalCharges.findIndex(
        charge => charge.chargeName.includes('Portion Skin Off')
      );
      
      if (existingIndex !== -1) {
        const newCharges = [...enquiryData.optionalCharges];
        newCharges.splice(existingIndex, 1);
        setEnquiryData(prev => ({
          ...prev,
          optionalCharges: newCharges
        }));
      }
    }
  };

  // Toggle handler for Pallet Charge
  const handleTogglePalletCharge = (isChecked: boolean) => {
    setPalletChargeEnabled(isChecked);
    
    if (isChecked) {
      // Enable the pallet charge
      setEnquiryData(prev => ({
        ...prev,
        palletCharge: selectedFactory?.palletCharge || 0
      }));
    } else {
      // Disable the pallet charge
      setEnquiryData(prev => ({
        ...prev,
        palletCharge: 0
      }));
    }
  };

  // Toggle handler for Terminal Charge
  const handleToggleTerminalCharge = (isChecked: boolean) => {
    setTerminalChargeEnabled(isChecked);
    
    if (isChecked) {
      // Enable the terminal charge
      setEnquiryData(prev => ({
        ...prev,
        terminalCharge: selectedFactory?.terminalCharge || 0
      }));
    } else {
      // Disable the terminal charge
      setEnquiryData(prev => ({
        ...prev,
        terminalCharge: 0
      }));
    }
  };

  // Toggle handler for Reception Fee
  const handleToggleReceptionFee = (isChecked: boolean) => {
    setReceptionFeeEnabled(isChecked);
    
    // The fee is directly calculated in the total cost
    // We don't need to add it to optional charges
  };
  
  // Toggle handler for Dispatch Fee
  const handleToggleDispatchFee = (isChecked: boolean) => {
    setDispatchFeeEnabled(isChecked);
    
    // The fee is directly calculated in the total cost
    // We don't need to add it to optional charges
  };
  
  // Toggle handler for Environmental Fee
  const handleToggleEnvironmentalFee = (isChecked: boolean) => {
    setEnvironmentalFeeEnabled(isChecked);
    
    // The fee is directly calculated in the total cost
    // We don't need to add it to optional charges
  };
  
  // Toggle handler for Electricity Fee
  const handleToggleElectricityFee = (isChecked: boolean) => {
    setElectricityFeeEnabled(isChecked);
    
    // The fee is directly calculated in the total cost
    // We don't need to add it to optional charges
  };

  // Event handlers
  const handleFreezingTypeChange = (value: string) => {
    // Get the freezing rate based on the selected freezing type
    let freezingRate = 0;
    if (value === 'Tunnel Freezing') {
      freezingRate = 1.65;
    } else if (value === 'Gyro Freezing') {
      freezingRate = 2.00;
    }
    
    console.log(`Setting freezing rate to ${freezingRate} for ${value}`);
    setEnquiryData(prev => ({
      ...prev,
      freezingType: value,
      freezingRate: freezingRate
    }));
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = ['quantity', 'yieldValue', 'palletCharge', 'terminalCharge'].includes(name)
      ? value === '' ? 0 : Number(value)
      : value;
    
    setEnquiryData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    
    if (name === 'factory') {
      const factory = factories.find(f => f.id === value) || null;
      setSelectedFactory(factory);
    } else {
      // Update the state with the new value
      setEnquiryData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Special case for rmSpec: update the base rate when it changes
      if (name === 'rmSpec' && value && enquiryData.product && enquiryData.trimType && selectedFactory?.rateData) {
        // Update the baseRate based on selected specifications
        const rateData = selectedFactory.rateData.find(item => 
          item.product === enquiryData.product && 
          item.trim_type === enquiryData.trimType && 
          item.rm_spec === value
        );
        
        if (rateData) {
          console.log('Found rate data:', rateData);
          setEnquiryData(prev => ({ 
            ...prev, 
            filletingRate: rateData.rate_per_kg || 0 
          }));
        } else {
          console.log('No rate data found for selected specifications');
          setEnquiryData(prev => ({ ...prev, filletingRate: 0 }));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccess(true);
        setTimeout(() => {
          setEnquiryData(initialEnquiryState);
          setSuccess(false);
          setProdABEnabled(false);
          setDescalingEnabled(false);
          setPortionSkinOnEnabled(false);
          setPortionSkinOffEnabled(false);
          setPalletChargeEnabled(true); // Note: These two default to true
          setTerminalChargeEnabled(true);
          setReceptionFeeEnabled(false);
          setDispatchFeeEnabled(false);
          setEnvironmentalFeeEnabled(false);
          setElectricityFeeEnabled(false);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Header 
      title="New Enquiry" 
      showBackButton={true}
      backPath="/dashboard"
      onBack={handleBack}
    />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Enquiry submitted successfully!
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Enquiry Details
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Factory Selection */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Factory Selection
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Factory</InputLabel>
                      <Select
                        name="factory"
                        value={selectedFactory?.id || ''}
                        label="Factory"
                        onChange={handleSelectChange}
                        disabled={isSubmitting}
                      >
                        {factories.map((factory) => (
                          <MenuItem key={factory.id} value={factory.id}>
                            {factory.name} ({factory.location})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>

                  {/* Product Information */}
                  <ProductInformation
                    productTypes={productTypes}
                    products={products}
                    trimTypes={trimTypes}
                    rmSpecs={rmSpecs}
                    productType={enquiryData.productType}
                    product={enquiryData.product}
                    trimType={enquiryData.trimType}
                    rmSpec={enquiryData.rmSpec}
                    yieldValue={enquiryData.yieldValue}
                    freezingType={enquiryData.freezingType}
                    isSubmitting={isSubmitting}
                    onProductTypeChange={(value) => handleSelectChange({ target: { name: 'productType', value } } as any)}
                    onProductChange={(value) => handleSelectChange({ target: { name: 'product', value } } as any)}
                    onTrimTypeChange={(value) => handleSelectChange({ target: { name: 'trimType', value } } as any)}
                    
                    onRmSpecChange={(value) => {
                        // Update the state directly without recursive call
                        setEnquiryData(prev => ({
                          ...prev,
                          rmSpec: value
                      }));
                      
                      // Then update the baseRate based on selected specifications
                      if (value && enquiryData.product && enquiryData.trimType && selectedFactory?.rateData) {
                        const rateData = selectedFactory.rateData.find(item => 
                          item.product === enquiryData.product && 
                          item.trim_type === enquiryData.trimType && 
                          item.rm_spec === value
                        );
                        
                        if (rateData) {
                          console.log('Found rate data:', rateData);
                          setEnquiryData(prev => ({ 
                            ...prev, 
                            filletingRate: rateData.rate_per_kg || 0 
                          }));
                        } else {
                          console.log('No rate data found for selected specifications');
                          setEnquiryData(prev => ({ ...prev, filletingRate: 0 }));
                        }
                      }
                    }}
                    onYieldValueChange={(value) => handleInputChange({ target: { name: 'yieldValue', value: value.toString() } } as any)}
                    onFreezingTypeChange={(value) => handleFreezingTypeChange(value)}
                  />

                  {/* Packaging Details */}
                  <PackagingDetails
                    product={enquiryData.product}
                    productType={enquiryData.productType}
                    boxQty={enquiryData.boxQty}
                    packagingType={enquiryData.packagingType}
                    transportMode={enquiryData.transportMode}
                    packagingRate={enquiryData.packagingRate}
                    palletCharge={enquiryData.palletCharge}
                    terminalCharge={enquiryData.terminalCharge}
                    isSubmitting={isSubmitting}
                    quantity={enquiryData.quantity}
                    onBoxQtyChange={(value) => handleSelectChange({ target: { name: 'boxQty', value } } as any)}
                    onPackagingTypeChange={(value) => handleSelectChange({ target: { name: 'packagingType', value } } as any)}
                    onTransportModeChange={(value) => handleSelectChange({ target: { name: 'transportMode', value } } as any)}
                    onPackagingRateChange={(value) => handleInputChange({ target: { name: 'packagingRate', value: value.toString() } } as any)}
                    onPalletChargeChange={(value) => handleInputChange({ target: { name: 'palletCharge', value: value.toString() } } as any)}
                    onTerminalChargeChange={(value) => handleInputChange({ target: { name: 'terminalCharge', value: value.toString() } } as any)}
                  />

                  {/* Filleting Rate Calculator */}
                  <FilletingRateCalculator
                    product={enquiryData.product}
                    productType={enquiryData.productType}
                    trimType={enquiryData.trimType}
                    onRateChange={(rate) => setEnquiryData(prev => ({ ...prev, filingRate: rate }))}
                  />

                  <Grid item xs={12}>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={isSubmitting || !enquiryData.product || !enquiryData.rmSpec || !enquiryData.boxQty}
                      >
                        {isSubmitting ? <CircularProgress size={24} /> : "Submit Enquiry"}
                      </Button>
                      
                      <Typography variant="h6">
                        Total Cost: {selectedFactory?.currency || '$'}{Number(enquiryData.totalCost || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
                      <CostSummary
                selectedFactory={selectedFactory}
                filletingRate={enquiryData.filletingRate}
                quantity={enquiryData.quantity}
              yieldValue={enquiryData.yieldValue}
              packagingRate={enquiryData.packagingRate}
              filingRate={enquiryData.filingRate}
              palletCharge={enquiryData.palletCharge}
              terminalCharge={enquiryData.terminalCharge}
              freezingRate={enquiryData.freezingRate}
              freezingType={enquiryData.freezingType}
              productType={enquiryData.productType}
              optionalCharges={enquiryData.optionalCharges}
              totalCharges={enquiryData.totalCost}
              onToggleProdAB={handleToggleProdAB}
              onToggleDescaling={handleToggleDescaling}
              onTogglePortionSkinOn={handleTogglePortionSkinOn}
              onTogglePortionSkinOff={handleTogglePortionSkinOff}
              onTogglePalletCharge={handleTogglePalletCharge}
              onToggleTerminalCharge={handleToggleTerminalCharge}
              onToggleReceptionFee={handleToggleReceptionFee}
              onToggleDispatchFee={handleToggleDispatchFee}
              onToggleEnvironmentalFee={handleToggleEnvironmentalFee}
              onToggleElectricityFee={handleToggleElectricityFee}
              prodABEnabled={prodABEnabled}
              descalingEnabled={descalingEnabled}
              portionSkinOnEnabled={portionSkinOnEnabled}
              portionSkinOffEnabled={portionSkinOffEnabled}
              palletChargeEnabled={palletChargeEnabled}
              terminalChargeEnabled={terminalChargeEnabled}
              receptionFeeEnabled={receptionFeeEnabled}
              dispatchFeeEnabled={dispatchFeeEnabled}
              environmentalFeeEnabled={environmentalFeeEnabled}
              electricityFeeEnabled={electricityFeeEnabled}
              product={enquiryData.product}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default NewEnquiry; 