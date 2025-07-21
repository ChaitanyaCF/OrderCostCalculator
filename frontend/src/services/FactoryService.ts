import axios from 'axios';
import { Factory } from '../context/FactoryContext';
import { PackageOption, RateOption } from '../utils/csvLoader';
import { API_ENDPOINTS } from '../config';
import AuthService from './AuthService';

const API_URL = API_ENDPOINTS.factories;

// Add request interceptor for debugging
axios.interceptors.request.use(request => {
  console.log('Request:', {
    method: request.method,
    url: request.url,
    data: request.data,
    headers: request.headers
  });
  return request;
}, error => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging
axios.interceptors.response.use(response => {
  console.log('Response:', {
    status: response.status,
    statusText: response.statusText,
    data: response.data
  });
  return response;
}, error => {
  console.error('Response error:', error);
  console.error('Response error details:', error.response?.data || 'No response data');
  return Promise.reject(error);
});

// Helper function to get auth headers
const getHeaders = () => {
  const user = AuthService.getCurrentUser();
  console.log('Auth service current user:', user);
  
  const headers = { 
    'Content-Type': 'application/json',
    ...(user && user.token ? { 'Authorization': `Bearer ${user.token}` } : {})
  };
  console.log('Using headers:', headers);
  return { headers };
};

// Add ChargeRate interface alongside the existing ones
interface ChargeRate {
  id?: number;
  chargeName: string;
  productType: string;
  product: string;
  subtype?: string;
  rateValue: number;
  factory?: any;
}

// Convert backend model to frontend model
const convertToFrontendFactory = (backendFactory: any): Factory => {
  return {
    id: backendFactory.id,
    name: backendFactory.name || '',
    location: backendFactory.location || '',
    currency: backendFactory.currency || 'USD',
    palletCharge: backendFactory.palletCharge || 0,
    terminalCharge: backendFactory.terminalCharge || 0,
    receptionFee: backendFactory.receptionFee || 0,
    dispatchFee: backendFactory.dispatchFee || 0,
    environmentalFeePercentage: backendFactory.environmentalFeePercentage || 0,
    electricityFeePercentage: backendFactory.electricityFeePercentage || 0,
    packagingData: backendFactory.packagingRates ? backendFactory.packagingRates.map((pr: any) => ({
      prod_type: pr.prodType,
      product: pr.product,
      box_qty: pr.boxQty, 
      pack: pr.pack,
      transport_mode: pr.transportMode,
      packaging_rate: pr.packagingRate
    })) : undefined,
    rateData: backendFactory.rateTables ? backendFactory.rateTables.map((rt: any) => ({
      product: rt.product,
      trim_type: rt.trimType,
      rm_spec: rt.rmSpec,
      rate_per_kg: rt.ratePerKg
    })) : undefined,
    chargeRates: backendFactory.chargeRates ? backendFactory.chargeRates.map((cr: any) => ({
      charge_name: cr.chargeName,
      product_type: cr.productType,
      product: cr.product,
      subtype: cr.subtype || '',
      rate_value: cr.rateValue
    })) : undefined
  };
};

// Convert frontend model to backend model for packaging rates
const convertToBackendPackagingRates = (packagingData: PackageOption[]) => {
  console.log('Converting packaging data to backend format, count:', packagingData.length);
  
  return packagingData.map((pd, index) => {
    // Ensure required fields have values
    if (!pd.prod_type) console.warn(`Item ${index}: prod_type is empty`);
    if (!pd.product) console.warn(`Item ${index}: product is empty`);
    if (!pd.box_qty) console.warn(`Item ${index}: box_qty is empty`);
    if (!pd.pack) console.warn(`Item ${index}: pack is empty`);
    if (!pd.transport_mode) console.warn(`Item ${index}: transport_mode is empty`);
    if (pd.packaging_rate === undefined || pd.packaging_rate === null) {
      console.warn(`Item ${index}: packaging_rate is missing, defaulting to 0`);
    }
    
    // Ensure rate is a number
    const packagingRate = typeof pd.packaging_rate === 'number' 
      ? pd.packaging_rate 
      : Number(pd.packaging_rate) || 0;
    
    return {
      prodType: String(pd.prod_type || ''),
      product: String(pd.product || ''),
      boxQty: String(pd.box_qty || ''),
      pack: String(pd.pack || ''),
      transportMode: String(pd.transport_mode || ''),
      packagingRate: packagingRate
    };
  });
};

// Convert frontend model to backend model for rate tables
const convertToBackendRateTables = (rateData: RateOption[]) => {
  console.log('Converting rate data to backend format, count:', rateData.length);
  
  return rateData.map((rd, index) => {
    // Ensure required fields have values
    if (!rd.product) console.warn(`Item ${index}: product is empty`);
    if (!rd.trim_type) console.warn(`Item ${index}: trim_type is empty`);
    if (!rd.rm_spec) console.warn(`Item ${index}: rm_spec is empty`);
    if (rd.rate_per_kg === undefined || rd.rate_per_kg === null) {
      console.warn(`Item ${index}: rate_per_kg is missing, defaulting to 0`);
    }
    
    // Ensure rate is a number
    const ratePerKg = typeof rd.rate_per_kg === 'number' 
      ? rd.rate_per_kg 
      : Number(rd.rate_per_kg) || 0;
    
    return {
      product: String(rd.product || ''),
      trimType: String(rd.trim_type || ''),
      rmSpec: String(rd.rm_spec || ''),
      ratePerKg: ratePerKg
    };
  });
};

// Convert frontend model to backend model for charge rates
const convertToBackendChargeRates = (chargeRates: any[]) => {
  console.log('Converting charge rates to backend format, count:', chargeRates.length);
  
  return chargeRates.map((cr, index) => {
    // Ensure required fields have values
    if (!cr.charge_name) console.warn(`Item ${index}: charge_name is empty`);
    if (!cr.product_type) console.warn(`Item ${index}: product_type is empty`);
    if (!cr.product) console.warn(`Item ${index}: product is empty`);
    if (cr.rate_value === undefined || cr.rate_value === null) {
      console.warn(`Item ${index}: rate_value is missing, defaulting to 0`);
    }
    
    // Ensure rate is a number
    const rateValue = typeof cr.rate_value === 'number' 
      ? cr.rate_value 
      : Number(cr.rate_value) || 0;
    
    return {
      chargeName: String(cr.charge_name || ''),
      productType: String(cr.product_type || ''),
      product: String(cr.product || ''),
      subtype: String(cr.subtype || ''),
      rateValue: rateValue
    };
  });
};

// Define backend model types
interface PackagingRate {
  id?: number;
  prodType: string;
  product: string;
  boxQty: string;
  pack: string;
  transportMode: string;
  packagingRate: number;
  factory?: any;
}

interface RateTable {
  id?: number;
  product: string;
  trimType: string;
  rmSpec: string;
  ratePerKg: number;
  factory?: any;
}

// Add a utility function to safely parse JSON if the response is a string
const safelyParseResponse = (data: any) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing response:', error);
      return null;
    }
  }
  return data;
};

// API calls with auth headers
export const getAllFactories = async (): Promise<Factory[]> => {
  try {
    const response = await axios.get('/api/factories', getHeaders());
    
    // Handle the response properly
    const data = safelyParseResponse(response.data);
    
    // Validate the response structure
    if (!Array.isArray(data)) {
      console.error('Factory API returned invalid data format', data);
      throw new Error('Received invalid data format from server');
    }
    
    console.log('Raw factories data from API:', data);
    
    // Convert each factory from backend format to frontend format
    const convertedFactories = data.map(factory => {
      console.log('Converting factory:', factory.name);
      return convertToFrontendFactory(factory);
    });
    
    console.log('Converted factories from backend format:', convertedFactories);
    
    // Check if rate data exists in the converted factories
    convertedFactories.forEach(factory => {
      console.log(`Factory ${factory.name} rate data:`, {
        hasRateData: !!factory.rateData,
        rateDataLength: factory.rateData ? factory.rateData.length : 0
      });
      
      // Log a sample of rate data for debugging if available
      if (factory.rateData && factory.rateData.length > 0) {
        console.log(`Sample rate data for ${factory.name}:`, factory.rateData[0]);
      }
    });
    
    return convertedFactories;
  } catch (error) {
    console.error('Error fetching factories:', error);
    throw error;
  }
};

export const getFactoryById = async (id: number): Promise<Factory> => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getHeaders());
    return convertToFrontendFactory(response.data);
  } catch (error: any) {
    console.error(`Failed to get factory ${id}:`, error);
    throw error;
  }
};

export const createFactory = async (factory: Omit<Factory, 'id'>): Promise<Factory> => {
  try {
    const response = await axios.post(
      API_URL, 
      {
        name: factory.name,
        location: factory.location,
        currency: factory.currency || 'USD'
      },
      getHeaders()
    );
    return convertToFrontendFactory(response.data);
  } catch (error: any) {
    console.error('Failed to create factory:', error);
    throw error;
  }
};

export const updateFactory = async (factory: Factory): Promise<Factory> => {
  try {
    const response = await axios.put(
      `${API_URL}/${factory.id}`, 
      {
        name: factory.name,
        location: factory.location,
        currency: factory.currency || 'USD'
      },
      getHeaders()
    );
    return convertToFrontendFactory(response.data);
  } catch (error: any) {
    console.error(`Failed to update factory ${factory.id}:`, error);
    throw error;
  }
};

export const deleteFactory = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`, getHeaders());
  } catch (error: any) {
    console.error(`Failed to delete factory ${id}:`, error);
    throw error;
  }
};

export const getPackagingRates = async (factoryId: number): Promise<PackageOption[]> => {
  try {
    console.log(`Fetching packaging rates for factory ${factoryId}`);
    
    // Use the new special endpoint for all data
    const url = `${API_URL}/${factoryId}/all-packaging-rates`;
    console.log(`Trying URL: ${url}`);
    
    // Make API request
    const response = await axios.get(url, getHeaders());
    console.log(`Raw packaging rates response from ${url}:`, response.data);
    
    // Handle string response (double-encoded JSON)
    let data = response.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
        console.log('Parsed packaging rates from string:', data);
      } catch (error) {
        console.error('Failed to parse packaging rates string response:', error);
      }
    }
    
    // If the data has a 'content' field, it might be using Spring Data pagination
    if (data && data.content && Array.isArray(data.content)) {
      console.log('Found paginated response with content field, extracting content array');
      data = data.content;
    }
    
    // If the data is wrapped in a data property
    if (data && data.data && Array.isArray(data.data)) {
      console.log('Found data wrapped in data property, extracting');
      data = data.data;
    }
    
    // Ensure we have an array
    if (!Array.isArray(data)) {
      console.error('Packaging rates response is not an array:', data);
      return [];
    }
    
    // Convert backend format to frontend format
    const formattedData: PackageOption[] = data.map(item => ({
      prod_type: item.prodType || '',
      product: item.product || '',
      box_qty: item.boxQty || '',
      pack: item.pack || '',
      transport_mode: item.transportMode || '',
      packaging_rate: typeof item.packagingRate === 'number' ? item.packagingRate : 0
    }));
    
    console.log(`Converted ${formattedData.length} packaging rates:`, formattedData);
    return formattedData;
  } catch (error: any) {
    console.error(`Failed to get packaging rates for factory ${factoryId}:`, error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const getRateTables = async (factoryId: number): Promise<RateOption[]> => {
  try {
    console.log(`Fetching rate tables for factory ${factoryId}`);
    
    // Use the new special endpoint for all data
    const url = `${API_URL}/${factoryId}/all-rate-tables`;
    console.log(`Trying URL: ${url}`);
    
    // Make API request
    const response = await axios.get(url, getHeaders());
    console.log(`Raw rate tables response from ${url}:`, response.data);
    
    // Handle string response (double-encoded JSON)
    let data = response.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
        console.log('Parsed rate tables from string:', data);
      } catch (error) {
        console.error('Failed to parse rate tables string response:', error);
      }
    }
    
    // If the data has a 'content' field, it might be using Spring Data pagination
    if (data && data.content && Array.isArray(data.content)) {
      console.log('Found paginated response with content field, extracting content array');
      data = data.content;
    }
    
    // If the data is wrapped in a data property
    if (data && data.data && Array.isArray(data.data)) {
      console.log('Found data wrapped in data property, extracting');
      data = data.data;
    }
    
    // Ensure we have an array
    if (!Array.isArray(data)) {
      console.error('Rate tables response is not an array:', data);
      return [];
    }
    
    // Convert backend format to frontend format
    const formattedData: RateOption[] = data.map(item => ({
      product: item.product || '',
      trim_type: item.trimType || '',
      rm_spec: item.rmSpec || '',
      rate_per_kg: typeof item.ratePerKg === 'number' ? item.ratePerKg : 0
    }));
    
    console.log(`Converted ${formattedData.length} rate tables:`, formattedData);
    return formattedData;
  } catch (error: any) {
    console.error(`Failed to get rate tables for factory ${factoryId}:`, error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const savePackagingRates = async (factoryId: number, packagingData: PackageOption[]): Promise<Factory> => {
  console.log(`Sending packaging rates to backend for factory ID: ${factoryId}`);
  console.log('Packaging data count:', packagingData.length);
  
  // CRITICAL DELETION FIX: If we're deleting all data (empty array), 
  // make sure any returned factory respects this
  const isDeletingAllData = packagingData.length === 0;
  if (isDeletingAllData) {
    console.log('DELETION DETECTED: Saving empty packaging data');
  }
  
  // Transform frontend format to backend format more carefully
  const backendPackagingRates = packagingData.map(item => {
    // Ensure packaging_rate is a valid number
    let packagingRate: number;
    if (typeof item.packaging_rate === 'number') {
      packagingRate = item.packaging_rate;
    } else if (typeof item.packaging_rate === 'string') {
      packagingRate = parseFloat(item.packaging_rate) || 0;
    } else {
      packagingRate = 0;
    }
    
    return {
      prodType: String(item.prod_type || ''),
      product: String(item.product || ''),
      boxQty: String(item.box_qty || ''),
      pack: String(item.pack || ''),
      transportMode: String(item.transport_mode || ''),
      packagingRate: packagingRate
    };
  });
  
  try {
    console.log('Sending packaging rates to backend:', backendPackagingRates.length);
    const response = await axios.post(
      `${API_URL}/${factoryId}/packaging-rates`, 
      backendPackagingRates,
      getHeaders()
    );
    
    // Get the factory from the response but ensure our data changes are respected
    const factory = convertToFrontendFactory(response.data);
    
    // For deletion operations, override the response data with empty arrays
    if (isDeletingAllData) {
      console.log('DELETION FIX: Forcing empty packaging data in response');
      factory.packagingData = [];
    }
    
    return factory;
  } catch (error: any) {
    console.error('Error saving packaging rates:', error.response?.data || error.message);
    throw new Error(`Failed to save packaging rates: ${error.response?.data?.message || error.message}`);
  }
};

export const saveRateTables = async (factoryId: number, rateData: RateOption[]): Promise<Factory> => {
  console.log(`Sending rate tables to backend for factory ID: ${factoryId}`);
  console.log('Rate data count:', rateData.length);
  
  // Transform frontend format to backend format more carefully
  const backendRateTables = rateData.map(item => {
    // Ensure rate_per_kg is a valid number
    let ratePerKg: number;
    if (typeof item.rate_per_kg === 'number') {
      ratePerKg = item.rate_per_kg;
    } else if (typeof item.rate_per_kg === 'string') {
      ratePerKg = parseFloat(item.rate_per_kg) || 0;
    } else {
      ratePerKg = 0;
    }
    
    return {
      product: String(item.product || ''),
      trimType: String(item.trim_type || ''),
      rmSpec: String(item.rm_spec || ''),
      ratePerKg: ratePerKg
    };
  });
  
  try {
    console.log('Sending rate tables to backend:', backendRateTables.length);
    const response = await axios.post(
      `${API_URL}/${factoryId}/rate-tables`, 
      backendRateTables,
      getHeaders()
    );
    return convertToFrontendFactory(response.data);
  } catch (error: any) {
    console.error('Error saving rate tables:', error.response?.data || error.message);
    throw new Error(`Failed to save rate tables: ${error.response?.data?.message || error.message}`);
  }
};

export const getChargeRates = async (factoryId: number): Promise<any[]> => {
  try {
    console.log(`Fetching charge rates for factory ${factoryId}`);
    
    // Use the special endpoint for all charge rates
    const url = `${API_URL}/${factoryId}/all-charge-rates`;
    console.log(`Trying URL: ${url}`);
    
    // Make API request
    const response = await axios.get(url, getHeaders());
    
    // Process the response
    let data = safelyParseResponse(response.data);
    
    // Handle potential parsing issues
    if (!data) {
      console.error('Failed to parse charge rates response');
      return [];
    }
    
    // Convert to frontend format if necessary
    const chargeRates = data.map((cr: any) => ({
      charge_name: cr.chargeName,
      product_type: cr.productType,
      product: cr.product,
      subtype: cr.subtype || '',
      rate_value: cr.rateValue
    }));
    
    console.log(`Successfully fetched ${chargeRates.length} charge rates`);
    return chargeRates;
  } catch (error: any) {
    console.error(`Failed to get charge rates for factory ${factoryId}:`, error);
    console.error('Error details:', error.response?.data || 'No response data');
    return [];
  }
};

export const saveChargeRates = async (factoryId: number, chargeRates: any[]): Promise<Factory> => {
  try {
    console.log(`Saving ${chargeRates.length} charge rates for factory ${factoryId}`);
    
    // Convert to backend format
    const backendChargeRates = convertToBackendChargeRates(chargeRates);
    
    // Make the API request
    const response = await axios.post(
      `${API_URL}/${factoryId}/charge-rates`, 
      backendChargeRates, 
      getHeaders()
    );
    
    // Process the response
    let data = safelyParseResponse(response.data);
    
    // Check if we got the updated factory back
    if (data && data.id) {
      console.log('Received updated factory from server');
      return convertToFrontendFactory(data);
    } else {
      console.log('Received charge rates array from server', data);
      
      // Fetch the updated factory to get all updated data
      return await getFactoryById(factoryId);
    }
  } catch (error: any) {
    console.error(`Failed to save charge rates for factory ${factoryId}:`, error);
    console.error('Error details:', error.response?.data || 'No response data');
    throw error;
  }
};

export const updateFactoryProperties = async (factoryId: number, properties: Partial<Factory>): Promise<Factory> => {
  try {
    console.log(`Updating factory ${factoryId} properties:`, properties);
    const payload = {
      palletCharge: properties.palletCharge,
      terminalCharge: properties.terminalCharge,
      receptionFee: properties.receptionFee,
      dispatchFee: properties.dispatchFee,
      environmentalFeePercentage: properties.environmentalFeePercentage,
      electricityFeePercentage: properties.electricityFeePercentage
    };
    
    const response = await axios.patch(
      `${API_URL}/${factoryId}/properties`, 
      payload,
      getHeaders()
    );
    
    return convertToFrontendFactory(response.data);
  } catch (error: any) {
    console.error(`Failed to update factory properties:`, error);
    throw error;
  }
}; 