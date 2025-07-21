import React from 'react';
import { Grid, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Divider } from '@mui/material';

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
  isSubmitting: boolean;
  onProductTypeChange: (value: string) => void;
  onProductChange: (value: string) => void;
  onTrimTypeChange: (value: string) => void;
  onRmSpecChange: (value: string) => void;
  onYieldValueChange: (value: number) => void;
  onFreezingTypeChange: (value: string) => void;
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
  isSubmitting,
  onProductTypeChange,
  onProductChange,
  onTrimTypeChange,
  onRmSpecChange,
  onYieldValueChange,
  onFreezingTypeChange
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Product Information
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Product Type</InputLabel>
          <Select
            value={productType}
            label="Product Type"
            onChange={(e) => onProductTypeChange(e.target.value)}
            disabled={isSubmitting}
          >
            {productTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {productType === 'Frozen' && (
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Freezing Type</InputLabel>
            <Select
              value={freezingType}
              label="Freezing Type"
              onChange={(e) => onFreezingTypeChange(e.target.value)}
              disabled={isSubmitting}
            >
              <MenuItem value="Tunnel Freezing">Tunnel Freezing (1.65 DKK/kg)</MenuItem>
              <MenuItem value="Gyro Freezing">Gyro Freezing (2.00 DKK/kg)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      )}
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!productType}>
          <InputLabel>Product</InputLabel>
          <Select
            value={product}
            label="Product"
            onChange={(e) => onProductChange(e.target.value)}
            disabled={isSubmitting || !productType}
          >
            {products.map((prod) => (
              <MenuItem key={prod} value={prod}>{prod}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!product}>
          <InputLabel>Trim Type</InputLabel>
          <Select
            value={trimType}
            label="Trim Type"
            onChange={(e) => onTrimTypeChange(e.target.value)}
            disabled={isSubmitting || !product}
          >
            {trimTypes.map((trim) => (
              <MenuItem key={trim} value={trim}>{trim}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!trimType}>
          <InputLabel>RM Specification</InputLabel>
          <Select
            value={rmSpec}
            label="RM Specification"
            onChange={(e) => onRmSpecChange(e.target.value)}
            disabled={isSubmitting || !trimType}
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
        />
      </Grid>
      
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>
    </>
  );
}; 