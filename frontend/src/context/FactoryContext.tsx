import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as csvLoader from '../utils/csvLoader';
import * as factoryService from '../services/FactoryService';
import AuthService from '../services/AuthService';

// Charge rate interface
export interface ChargeRateOption {
  charge_name: string;
  product_type: string;
  product: string;
  subtype?: string;
  rate_value: number;
}

// Factory interface
export interface Factory {
  id: number;
  name: string;
  location: string;
  currency: string;
  palletCharge?: number;
  terminalCharge?: number;
  receptionFee?: number;
  dispatchFee?: number;
  environmentalFeePercentage?: number;
  electricityFeePercentage?: number;
  packagingData?: csvLoader.PackageOption[];
  rateData?: csvLoader.RateOption[];
  chargeRates?: ChargeRateOption[];
}

// Default factories - shared with FactoryRateCard and NewEnquiry
export const DEFAULT_FACTORIES: Factory[] = [
  { 
    id: 1, 
    name: 'Skagerak', 
    location: 'Norway', 
    currency: 'DKK', 
    palletCharge: 0.30, 
    terminalCharge: 0.20,
    receptionFee: 0.10,
    dispatchFee: 0.15,
    environmentalFeePercentage: 2.0,
    electricityFeePercentage: 1.5
  },
  { 
    id: 2, 
    name: 'Factory B', 
    location: 'Delhi', 
    currency: 'USD', 
    palletCharge: 0.25, 
    terminalCharge: 0.18,
    receptionFee: 0.08,
    dispatchFee: 0.12,
    environmentalFeePercentage: 1.8,
    electricityFeePercentage: 1.2
  },
  { 
    id: 3, 
    name: 'Factory C', 
    location: 'Bangalore', 
    currency: 'USD', 
    palletCharge: 0.25, 
    terminalCharge: 0.15,
    receptionFee: 0.07,
    dispatchFee: 0.10,
    environmentalFeePercentage: 1.5,
    electricityFeePercentage: 1.0
  }
];

// Fallback data in case CSV files aren't loaded properly
export const FALLBACK_PACKAGING_DATA: csvLoader.PackageOption[] = [
  {
    prod_type: 'Fresh',
    product: 'Fillet',
    box_qty: '10 kg',
    pack: 'EPS',
    transport_mode: 'regular',
    packaging_rate: 2
  },
  {
    prod_type: 'Frozen',
    product: 'Fillet',
    box_qty: '20 kg',
    pack: 'Solid Box',
    transport_mode: 'regular',
    packaging_rate: 1.75
  }
];

export const FALLBACK_RATE_DATA: csvLoader.RateOption[] = [
  {
    product: 'Fillet',
    trim_type: 'Trim A',
    rm_spec: '1-2 kg',
    rate_per_kg: 14.2
  },
  {
    product: 'Portions',
    trim_type: 'Trim A',
    rm_spec: '1-2 kg',
    rate_per_kg: 14.2
  }
];

// Fallback charge rate data in case DB fetch fails
export const FALLBACK_CHARGE_RATES: ChargeRateOption[] = [
  {
    charge_name: 'Filleting Rate',
    product_type: 'Fresh',
    product: 'Salmon',
    subtype: 'Fillet',
    rate_value: 2.00
  },
  {
    charge_name: 'Pallet Charge',
    product_type: 'Fresh',
    product: 'Salmon',
    rate_value: 0.30
  },
  {
    charge_name: 'Freezing Rate',
    product_type: 'Frozen',
    product: 'Salmon',
    subtype: 'Tunnel Freezing',
    rate_value: 1.65
  }
];

interface FactoryContextType {
  factories: Factory[];
  selectedFactory: Factory | null;
  setFactories: (factories: Factory[]) => void;
  setSelectedFactory: (factory: Factory | null) => void;
  addFactory: (name: string, location: string) => Promise<Factory>;
  updateFactoryData: (
    factoryId: number, 
    packagingData?: csvLoader.PackageOption[], 
    rateData?: csvLoader.RateOption[],
    chargeRates?: ChargeRateOption[],
    palletCharge?: number,
    terminalCharge?: number,
    receptionFee?: number,
    dispatchFee?: number,
    environmentalFeePercentage?: number,
    electricityFeePercentage?: number
  ) => Promise<void>;
  getPackagingData: () => csvLoader.PackageOption[];
  getRateData: () => csvLoader.RateOption[];
  getChargeRates: () => ChargeRateOption[];
  loadFactoryData: (factory: Factory) => Promise<void>;
  clearFactoryData: (
    factoryId: number,
    clearPackaging: boolean,
    clearRates: boolean
  ) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export const useFactory = (): FactoryContextType => {
  const context = useContext(FactoryContext);
  if (!context) {
    throw new Error('useFactory must be used within a FactoryProvider');
  }
  return context;
};

interface FactoryProviderProps {
  children: ReactNode;
}

export const FactoryProvider: React.FC<FactoryProviderProps> = ({ children }) => {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load default data with fallbacks if CSV parsing fails
  let defaultPackagingData: csvLoader.PackageOption[] = [];
  let defaultRateData: csvLoader.RateOption[] = [];
  
  try {
    defaultPackagingData = csvLoader.getPackagingTable();
    // If default packaging data is empty, use fallback data
    if (!defaultPackagingData || defaultPackagingData.length === 0) {
      console.warn('Default packaging data is empty, using fallback data');
      defaultPackagingData = FALLBACK_PACKAGING_DATA;
    }
  } catch (error) {
    console.error('Error loading default packaging data:', error);
    defaultPackagingData = FALLBACK_PACKAGING_DATA;
  }
  
  try {
    defaultRateData = csvLoader.getRateTable();
    // If default rate data is empty, use fallback data
    if (!defaultRateData || defaultRateData.length === 0) {
      console.warn('Default rate data is empty, using fallback data');
      defaultRateData = FALLBACK_RATE_DATA;
    }
  } catch (error) {
    console.error('Error loading default rate data:', error);
    defaultRateData = FALLBACK_RATE_DATA;
  }

  // Function to load factory data from API
  const loadFactoryData = async (factory: Factory): Promise<void> => {
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
        return;
      }

      // First check if the factory already has empty arrays - if so, respect that
      const hasEmptyPackagingData = Array.isArray(factory.packagingData) && factory.packagingData.length === 0;
      const hasEmptyRateData = Array.isArray(factory.rateData) && factory.rateData.length === 0;
      
      // Initialize our data variables
      let packData: csvLoader.PackageOption[] = [];
      let rateData: csvLoader.RateOption[] = [];
      let chargeRates: ChargeRateOption[] = [];
      
      // Only load packaging data if we don't have an explicit empty array
      if (!hasEmptyPackagingData) {
        // Try to load packaging rates
        packData = await factoryService.getPackagingRates(factory.id);
        console.log("Loaded packaging data:", packData?.length || 0, "items");
      } else {
        console.log("Factory has empty packaging data, respecting this state");
      }
      
      // Only load rate data if we don't have an explicit empty array
      if (!hasEmptyRateData) {
        // Try to load rate tables
        rateData = await factoryService.getRateTables(factory.id);
        console.log("Loaded rate data:", rateData?.length || 0, "items");
      } else {
        console.log("Factory has empty rate data, respecting this state");
      }
      
      // Always load charge rates (not part of deletion issue)
      chargeRates = await factoryService.getChargeRates(factory.id);
      console.log("Loaded charge rates:", chargeRates?.length || 0, "items");
      
      // Get the latest factory data to ensure we have current pallet/terminal charges
      const updatedFactoryData = await factoryService.getFactoryById(factory.id);
      console.log("Updated factory data:", updatedFactoryData);
      
      // Update the factory with the loaded data
      const updatedFactory = {
        ...updatedFactoryData,
        packagingData: hasEmptyPackagingData ? [] : packData,
        rateData: hasEmptyRateData ? [] : rateData,
        chargeRates: chargeRates,
        palletCharge: updatedFactoryData.palletCharge || factory.palletCharge || 0,
        terminalCharge: updatedFactoryData.terminalCharge || factory.terminalCharge || 0
      };
      
      console.log("Updated factory with all data:", updatedFactory);
      
      // Update the factories list
      const updatedFactories = factories.map(f => 
        f.id === factory.id ? updatedFactory : f
      );
      
      setFactories(updatedFactories);
      
      // If this is the selected factory, update it too
      if (selectedFactory?.id === factory.id) {
        setSelectedFactory(updatedFactory);
      }
    } catch (err: any) {
      console.error("Error loading factory data:", err);
      setError(`Failed to load factory data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Load factories from backend
  useEffect(() => {
    const loadFactories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load factories from the backend API
        const loadedFactories = await factoryService.getAllFactories();
        console.log('Loaded factories from backend:', loadedFactories);
        
        if (loadedFactories && loadedFactories.length > 0) {
          setFactories(loadedFactories);
          
          // If no factory is selected or the selected factory doesn't exist anymore,
          // select the first factory
          if (!selectedFactory || !loadedFactories.find(f => f.id === selectedFactory.id)) {
            setSelectedFactory(loadedFactories[0]);
          }
        } else {
          console.warn('No factories loaded from backend, using default factories');
          setFactories(DEFAULT_FACTORIES);
          setSelectedFactory(DEFAULT_FACTORIES[0]);
        }
      } catch (error) {
        console.error('Error loading factories:', error);
        setError('Failed to load factories from server. Using default factories.');
        
        // Fallback to default factories
        setFactories(DEFAULT_FACTORIES);
        setSelectedFactory(DEFAULT_FACTORIES[0]);
      } finally {
        setLoading(false);
      }
    };
    
    loadFactories();
  }, []);

  const addFactory = async (name: string, location: string): Promise<Factory> => {
    try {
      setLoading(true);
      setError(null);

      // Create the factory on the backend
      const newFactory = await factoryService.createFactory({ name, location, currency: 'USD' });
      console.log('Factory created successfully:', newFactory);
      
      // Update the local state with the new factory
      const updatedFactories = [...factories, newFactory];
      setFactories(updatedFactories);
      
      // Immediately select the new factory
      setSelectedFactory(newFactory);
      
      return newFactory;
    } catch (err) {
      console.error("Error adding factory:", err);
      setError("Failed to add factory");
      throw new Error("Failed to add factory");
    } finally {
      setLoading(false);
    }
  };

  const updateFactoryData = async (
    factoryId: number, 
    packagingData?: csvLoader.PackageOption[], 
    rateData?: csvLoader.RateOption[],
    chargeRates?: ChargeRateOption[],
    palletCharge?: number,
    terminalCharge?: number,
    receptionFee?: number,
    dispatchFee?: number,
    environmentalFeePercentage?: number,
    electricityFeePercentage?: number
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Updating factory data:", {
        factoryId,
        packagingDataCount: packagingData?.length,
        rateDataCount: rateData?.length,
        chargeRatesCount: chargeRates?.length,
        palletCharge,
        terminalCharge,
        receptionFee,
        dispatchFee,
        environmentalFeePercentage,
        electricityFeePercentage
      });

      let updatedFactory: Factory | null = null;
      const factory = factories.find(f => f.id === factoryId);
      
      if (!factory) {
        console.error(`Factory with ID ${factoryId} not found in:`, {
          factoryIds: factories.map(f => f.id)
        });
        throw new Error(`Factory with ID ${factoryId} not found`);
      }

      // Update factory properties if any provided
      if (palletCharge !== undefined || terminalCharge !== undefined || 
          receptionFee !== undefined || dispatchFee !== undefined ||
          environmentalFeePercentage !== undefined || electricityFeePercentage !== undefined) {
        const updatedProperties: Partial<Factory> = {
          ...factory,
          palletCharge: palletCharge !== undefined ? palletCharge : factory.palletCharge,
          terminalCharge: terminalCharge !== undefined ? terminalCharge : factory.terminalCharge,
          receptionFee: receptionFee !== undefined ? receptionFee : factory.receptionFee,
          dispatchFee: dispatchFee !== undefined ? dispatchFee : factory.dispatchFee,
          environmentalFeePercentage: environmentalFeePercentage !== undefined ? environmentalFeePercentage : factory.environmentalFeePercentage,
          electricityFeePercentage: electricityFeePercentage !== undefined ? electricityFeePercentage : factory.electricityFeePercentage
        };
        updatedFactory = await factoryService.updateFactoryProperties(factoryId, updatedProperties);
        console.log("Updated factory properties:", updatedFactory);
      }

      // Update packaging data if provided (even if it's an empty array)
      if (packagingData !== undefined) {
        // If it's an empty array, we're explicitly deleting all data
        console.log(`Saving packaging data: ${packagingData.length} items`);
        updatedFactory = await factoryService.savePackagingRates(factoryId, packagingData);
        
        // For deletion operations (empty arrays), immediately update the local state as well
        if (packagingData.length === 0) {
          console.log('Empty packaging data detected, ensuring local state reflects deletion');
          // Update the existing factories data to have empty packaging data
          const factoryToUpdate = factories.find(f => f.id === factoryId);
          if (factoryToUpdate) {
            factoryToUpdate.packagingData = [];
          }
        }
      }

      // Update rate data if provided (even if it's an empty array)
      if (rateData !== undefined) {
        // If it's an empty array, we're explicitly deleting all data
        console.log(`Saving rate data: ${rateData.length} items`);
        updatedFactory = await factoryService.saveRateTables(factoryId, rateData);
        
        // For deletion operations (empty arrays), immediately update the local state as well
        if (rateData.length === 0) {
          console.log('Empty rate data detected, ensuring local state reflects deletion');
          // Update the existing factories data to have empty rate data
          const factoryToUpdate = factories.find(f => f.id === factoryId);
          if (factoryToUpdate) {
            factoryToUpdate.rateData = [];
          }
        }
      }
      
      // Update charge rates if provided
      if (chargeRates) {
        updatedFactory = await factoryService.saveChargeRates(factoryId, chargeRates);
      }

      if (updatedFactory) {
        // Make sure we preserve all data
        const existingFactory = factories.find(f => f.id === factoryId);
        if (existingFactory) {
          // IMPORTANT: For packaging/rateData, we need to respect intentional emptiness
          // Only use existing data if the new data is undefined (not provided in the update)
          // This is key for deletion operations where we want empty arrays to stay empty
          updatedFactory = {
            ...updatedFactory,
            // Only use existing data if the data wasn't provided in this update
            packagingData: packagingData !== undefined ? packagingData : 
                         (updatedFactory.packagingData || existingFactory.packagingData),
            rateData: rateData !== undefined ? rateData : 
                     (updatedFactory.rateData || existingFactory.rateData),
            chargeRates: updatedFactory.chargeRates || existingFactory.chargeRates,
            palletCharge: updatedFactory.palletCharge || existingFactory.palletCharge || 0,
            terminalCharge: updatedFactory.terminalCharge || existingFactory.terminalCharge || 0
          };
        }
        
        // Update factories list
        const newFactories = factories.map(f => 
          f.id === factoryId ? updatedFactory! : f
        );
        setFactories(newFactories);
        
        // Update selected factory if needed
        if (selectedFactory?.id === factoryId) {
          setSelectedFactory(updatedFactory);
        }
      }
    } catch (err: any) {
      console.error("Error updating factory data:", err);
      setError(`Failed to update factory data: ${err.message || 'Unknown error'}`);
      throw new Error(`Failed to update factory data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getPackagingData = (): csvLoader.PackageOption[] => {
    return selectedFactory?.packagingData || [];
  };

  const getRateData = (): csvLoader.RateOption[] => {
    return selectedFactory?.rateData || [];
  };
  
  const getChargeRates = (): ChargeRateOption[] => {
    return selectedFactory?.chargeRates || FALLBACK_CHARGE_RATES;
  };

  // Add a new function for explicitly clearing data
  const clearFactoryData = async (
    factoryId: number,
    clearPackaging: boolean,
    clearRates: boolean
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Clearing data for factory ${factoryId}. Packaging: ${clearPackaging}, Rates: ${clearRates}`);
      
      // Find the factory
      const factory = factories.find(f => f.id === factoryId);
      if (!factory) {
        throw new Error(`Factory with ID ${factoryId} not found`);
      }
      
      // Clone the factory to make changes
      const updatedFactory = { ...factory };
      
      // Clear packaging data if requested
      if (clearPackaging) {
        console.log(`Clearing packaging data for factory ${factoryId}`);
        await factoryService.savePackagingRates(factoryId, []);
        updatedFactory.packagingData = [];
      }
      
      // Clear rate data if requested
      if (clearRates) {
        console.log(`Clearing rate data for factory ${factoryId}`);
        await factoryService.saveRateTables(factoryId, []);
        updatedFactory.rateData = [];
      }
      
      // Update the factories list
      const updatedFactories = factories.map(f => 
        f.id === factoryId ? updatedFactory : f
      );
      setFactories(updatedFactories);
      
      // Update selected factory if needed
      if (selectedFactory?.id === factoryId) {
        setSelectedFactory(updatedFactory);
      }
      
      console.log("Factory data cleared successfully:", updatedFactory);
    } catch (err: any) {
      console.error("Error clearing factory data:", err);
      setError(`Failed to clear factory data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FactoryContext.Provider
      value={{
        factories,
        selectedFactory,
        setFactories,
        setSelectedFactory,
        addFactory,
        updateFactoryData,
        getPackagingData,
        getRateData,
        getChargeRates,
        loadFactoryData,
        clearFactoryData,
        loading,
        error
      }}
    >
      {children}
    </FactoryContext.Provider>
  );
};