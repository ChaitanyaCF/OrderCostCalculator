import React, { useState, useEffect } from 'react';
import { Grid, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Divider, FormControlLabel, Checkbox } from '@mui/material';

interface ProductInformationProps {
  productTypes: string[];
  products: string[];
  trimTypes: string[];
  rmSpecs: string[];
  productType: string;
  product: string;
  trimType: string;
  rmSpec: string;
  yieldValue: number;
  freezingType: string;
  isStorageRequired: boolean;
  numberOfWeeks: number;
  isSubmitting: boolean;
  onProductTypeChange: (value: string) => void;
  onProductChange: (value: string) => void;
  onTrimTypeChange: (value: string) => void;
  onRmSpecChange: (value: string) => void;
  onYieldValueChange: (value: number) => void;
  onFreezingTypeChange: (value: string) => void;
  onStorageRequiredChange: (value: boolean) => void;
  onNumberOfWeeksChange: (value: number) => void;
}

export const ProductInformation: React.FC<ProductInformationProps> = ({
  productTypes,
  products,
  trimTypes,
  rmSpecs,
  productType,
  product,
  trimType,
  rmSpec,
  yieldValue,
  freezingType,
  isStorageRequired,
  numberOfWeeks,
  isSubmitting,
  onProductTypeChange,
  onProductChange,
  onTrimTypeChange,
  onRmSpecChange,
  onYieldValueChange,
  onFreezingTypeChange,
  onStorageRequiredChange,
  onNumberOfWeeksChange
}) => {
  // Local state for number of weeks display value to handle decimals properly
  const [weeksDisplayValue, setWeeksDisplayValue] = useState(numberOfWeeks.toString());

  // Sync display value with prop changes
  useEffect(() => {
    setWeeksDisplayValue(numberOfWeeks.toString());
  }, [numberOfWeeks]);

  const handleNumberOfWeeksChange = (value: string) => {
    setWeeksDisplayValue(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      onNumberOfWeeksChange(numericValue);
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Product Information
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required size="small">
          <InputLabel>Product Type</InputLabel>
          <Select
            value={productType}
            label="Product Type"
            onChange={(e) => onProductTypeChange(e.target.value)}
            disabled={isSubmitting}
            size="small"
          >
            {productTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {productType === 'Frozen' && (
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required size="small">
            <InputLabel>Freezing Type</InputLabel>
            <Select
              value={freezingType}
              label="Freezing Type"
              onChange={(e) => onFreezingTypeChange(e.target.value)}
              disabled={isSubmitting}
              size="small"
            >
              <MenuItem value="Tunnel Freezing">Tunnel Freezing (1.65 DKK/kg)</MenuItem>
              <MenuItem value="Gyro Freezing">Gyro Freezing (2.00 DKK/kg)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      )}
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!productType} size="small">
          <InputLabel>Product</InputLabel>
          <Select
            value={product}
            label="Product"
            onChange={(e) => onProductChange(e.target.value)}
            disabled={isSubmitting || !productType}
            size="small"
          >
            {products.map((prod) => (
              <MenuItem key={prod} value={prod}>{prod}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!product} size="small">
          <InputLabel>Trim Type</InputLabel>
          <Select
            value={trimType}
            label="Trim Type"
            onChange={(e) => onTrimTypeChange(e.target.value)}
            disabled={isSubmitting || !product}
            size="small"
          >
            {trimTypes.map((trim) => (
              <MenuItem key={trim} value={trim}>{trim}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!trimType} size="small">
          <InputLabel>RM Specification</InputLabel>
          <Select
            value={rmSpec}
            label="RM Specification"
            onChange={(e) => onRmSpecChange(e.target.value)}
            disabled={isSubmitting || !trimType}
            size="small"
          >
            {rmSpecs.map((spec) => (
              <MenuItem key={spec} value={spec}>{spec}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          type="number"
          label="Yield Value (%)"
          value={yieldValue}
          onChange={(e) => onYieldValueChange(parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0, max: 100, step: 0.1 }}
          disabled={isSubmitting}
          size="small"
        />
      </Grid>
      
      {/* Storage requirements for Frozen products */}
      {productType === 'Frozen' && (
        <>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isStorageRequired}
                  onChange={(e) => onStorageRequiredChange(e.target.checked)}
                  disabled={isSubmitting}
                />
              }
              label="Is Storage Required?"
            />
          </Grid>
          
          {isStorageRequired && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Weeks"
                value={weeksDisplayValue}
                onChange={(e) => handleNumberOfWeeksChange(e.target.value)}
                inputProps={{ min: 0, step: 0.1 }}
                disabled={isSubmitting}
                helperText="Decimal values allowed (e.g., 1.5)"
                size="small"
              />
            </Grid>
          )}
        </>
      )}
      
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>
    </>
  );
}; 