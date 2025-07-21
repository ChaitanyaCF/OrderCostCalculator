import packTableData from '../data/pack_table.csv';
import rateTableData from '../data/rate_table.csv';

// Define interfaces based on the CSV structures
export interface PackageOption {
  prod_type: string;
  product: string;
  box_qty: string;
  pack: string;
  transport_mode: string;
  packaging_rate: number;
}

export interface RateOption {
  product: string;
  trim_type: string;
  rm_spec: string;
  rate_per_kg: number;
}

/**
 * Parse CSV data into an array of objects
 * @param csvText The raw CSV text
 * @returns Array of objects with keys from the header row
 */
export const parseCSV = (csvText: string): any[] => {
  try {
    console.log('Starting CSV parsing with text length:', csvText.length);
    
    // Handle both CRLF and LF line endings
    const lines = csvText.replace(/\r\n/g, '\n').trim().split('\n');
    
    console.log('Found lines:', lines.length);
    
    // If the CSV is empty, return an empty array instead of throwing an error
    if (lines.length === 0) {
      console.warn('CSV file is empty, returning empty array');
      return [];
    }
    
    // If there's only a header row, return an empty array instead of throwing an error
    if (lines.length === 1) {
      console.warn('CSV file has only headers, no data rows, returning empty array');
      return [];
    }
    
    // Parse header row
    const headerLine = lines[0];
    console.log('Header line:', headerLine);
    
    const headers = parseCsvRow(headerLine);
    console.log('Parsed headers:', headers);
    
    if (headers.length === 0) {
      console.warn('CSV file has no valid headers, returning empty array');
      return [];
    }
    
    // For packaging rates, verify required columns
    if (headers.includes('prod_type') && !headers.includes('packaging_rate')) {
      console.warn('CSV file is missing required packaging_rate column, returning empty array');
      return [];
    }
    
    // For rate tables, verify required columns
    if (headers.includes('rate_per_kg') && !headers.includes('product')) {
      console.warn('CSV file is missing required product column, returning empty array');
      return [];
    }
    
    // Process data rows
    const result = lines.slice(1).map((line, index) => {
      if (!line.trim()) {
        console.log(`Skipping empty line at index ${index + 1}`);
        return null; // Skip empty lines
      }
      
      const values = parseCsvRow(line);
      console.log(`Row ${index + 1} values:`, values);
      
      if (values.length !== headers.length) {
        console.warn(`Row ${index + 1} has ${values.length} values but headers has ${headers.length}`);
      }
      
      const obj: any = {};
      
      // Map values to headers
      headers.forEach((header, idx) => {
        if (idx < values.length) {
          const value = values[idx].trim();
          // Convert numeric values
          obj[header] = !isNaN(Number(value)) && value !== '' 
            ? Number(value) 
            : value;
        } else {
          // Handle missing values
          console.warn(`Row ${index + 1} is missing a value for header "${header}"`);
          obj[header] = '';
        }
      });
      
      return obj;
    }).filter(item => item !== null); // Remove null entries
    
    console.log('Parsed', result.length, 'data rows');
    
    // If all rows were filtered out, return an empty array instead of throwing an error
    if (result.length === 0) {
      console.warn('CSV file has no valid data rows after parsing, returning empty array');
      return [];
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    // Return empty array instead of rethrowing the error
    console.warn('Returning empty array due to parsing error');
    return [];
  }
};

/**
 * Parse a single CSV row, handling quoted values and commas within quotes
 * @param row A single row of CSV text
 * @returns Array of values from the row
 */
const parseCsvRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      // Toggle quote status
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      // Add character to current field
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  // Clean up any quotes from the result
  return result.map(value => value.replace(/^"(.*)"$/, '$1'));
};

/**
 * Get unique values from an array
 * @param array The array to get unique values from
 * @returns Array with unique values
 */
const getUniqueValues = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Get all available product types from the packaging table
 * @returns Array of unique product types
 */
export const getProductTypes = (): string[] => {
  const packData = parseCSV(packTableData);
  return getUniqueValues(packData.map((item: PackageOption) => item.prod_type));
};

/**
 * Get products by product type
 * @param prodType The product type to filter by
 * @returns Array of unique products for the given product type
 */
export const getProductsByType = (prodType: string): string[] => {
  const packData = parseCSV(packTableData);
  return getUniqueValues(
    packData
      .filter((item: PackageOption) => item.prod_type === prodType)
      .map((item: PackageOption) => item.product)
  );
};

/**
 * Get packaging options by product type and product
 * @param prodType The product type
 * @param product The product name
 * @returns Array of packaging options
 */
export const getPackagingOptions = (prodType: string, product: string): PackageOption[] => {
  const packData = parseCSV(packTableData);
  return packData.filter(
    (item: PackageOption) => 
      item.prod_type === prodType && 
      item.product === product
  );
};

/**
 * Get available transport modes for a product and package
 * @param prodType The product type
 * @param product The product name
 * @returns Array of unique transport modes
 */
export const getTransportModes = (prodType: string, product: string): string[] => {
  const packData = parseCSV(packTableData);
  return getUniqueValues(
    packData
      .filter((item: PackageOption) => 
        item.prod_type === prodType && 
        item.product === product
      )
      .map((item: PackageOption) => item.transport_mode)
  );
};

/**
 * Get available trim types for a product
 * @param product The product name
 * @returns Array of unique trim types
 */
export const getTrimTypes = (product: string): string[] => {
  const rateData = parseCSV(rateTableData);
  return getUniqueValues(
    rateData
      .filter((item: RateOption) => item.product === product)
      .map((item: RateOption) => item.trim_type)
  );
};

/**
 * Get available RM specs for a product and trim type
 * @param product The product name
 * @param trimType The trim type
 * @returns Array of unique RM specs
 */
export const getRmSpecs = (product: string, trimType: string): string[] => {
  const rateData = parseCSV(rateTableData);
  return getUniqueValues(
    rateData
      .filter((item: RateOption) => 
        item.product === product && 
        item.trim_type === trimType
      )
      .map((item: RateOption) => item.rm_spec)
  );
};

/**
 * Get the rate per kg for a specific product, trim type and RM spec
 * @param product The product name
 * @param trimType The trim type
 * @param rmSpec The RM specification
 * @returns The rate per kg or 0 if not found
 */
export const getRatePerKg = (product: string, trimType: string, rmSpec: string): number => {
  const rateData = parseCSV(rateTableData);
  const match = rateData.find((item: RateOption) => 
    item.product === product && 
    item.trim_type === trimType && 
    item.rm_spec === rmSpec
  );
  
  return match ? match.rate_per_kg : 0;
};

/**
 * Get the packaging rate for specific options
 * @param prodType The product type
 * @param product The product name
 * @param boxQty The box quantity/size
 * @param transportMode The transport mode
 * @returns The packaging rate or 0 if not found
 */
export const getPackagingRate = (
  prodType: string, 
  product: string, 
  boxQty: string, 
  transportMode: string
): number => {
  const packData = parseCSV(packTableData);
  const match = packData.find((item: PackageOption) => 
    item.prod_type === prodType && 
    item.product === product && 
    item.box_qty === boxQty && 
    item.transport_mode === transportMode
  );
  
  return match ? match.packaging_rate : 0;
};

/**
 * Get all available box quantities for a product and transport mode
 * @param prodType The product type
 * @param product The product name
 * @param transportMode The transport mode
 * @returns Array of unique box quantities
 */
export const getBoxQuantities = (
  prodType: string, 
  product: string, 
  transportMode: string
): string[] => {
  const packData = parseCSV(packTableData);
  return getUniqueValues(
    packData
      .filter((item: PackageOption) => 
        item.prod_type === prodType && 
        item.product === product && 
        item.transport_mode === transportMode
      )
      .map((item: PackageOption) => item.box_qty)
  );
};

// Export the parsed data for direct access if needed
export const getPackagingTable = (): PackageOption[] => parseCSV(packTableData);
export const getRateTable = (): RateOption[] => parseCSV(rateTableData); 