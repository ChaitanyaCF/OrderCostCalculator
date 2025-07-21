import React, { useEffect } from 'react';
import { Grid, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Divider } from '@mui/material';
import { useFactory } from '../../context/FactoryContext';

interface PackagingDetailsProps {
  product: string;
  productType: string;
  boxQty: string;
  packagingType: string;
  transportMode: string;
  packagingRate: number;
  palletCharge: number;
  terminalCharge: number;
  isSubmitting: boolean;
  quantity?: number;
  onBoxQtyChange: (value: string) => void;
  onPackagingTypeChange: (value: string) => void;
  onTransportModeChange: (value: string) => void;
  onPackagingRateChange: (value: number) => void;
  onPalletChargeChange: (value: number) => void;
  onTerminalChargeChange: (value: number) => void;
}

export const PackagingDetails: React.FC<PackagingDetailsProps> = ({
  product,
  productType,
  boxQty,
  packagingType,
  transportMode,
  packagingRate,
  palletCharge,
  terminalCharge,
  isSubmitting,
  quantity,
  onBoxQtyChange,
  onPackagingTypeChange,
  onTransportModeChange,
  onPackagingRateChange,
  onPalletChargeChange,
  onTerminalChargeChange
}) => {
  const { selectedFactory } = useFactory();
  const [boxQuantities, setBoxQuantities] = React.useState<string[]>([]);
  const [packagingTypes, setPackagingTypes] = React.useState<string[]>([]);
  const [transportModes, setTransportModes] = React.useState<string[]>([]);

  // Load box quantities when product changes
  useEffect(() => {
    if (product && selectedFactory?.packagingData) {
      const quantities = selectedFactory.packagingData
        .filter(item => 
          item.product === product && 
          item.prod_type === productType && 
          item.box_qty
        )
        .map(item => item.box_qty);
      
      const uniqueQuantities = Array.from(new Set(quantities.filter(Boolean))).sort();
      setBoxQuantities(uniqueQuantities);
      
      if (uniqueQuantities.length === 1) {
        onBoxQtyChange(uniqueQuantities[0]);
      } else if (!uniqueQuantities.includes(boxQty)) {
        onBoxQtyChange('');
      }
    } else {
      setBoxQuantities([]);
      onBoxQtyChange('');
    }
  }, [product, productType, selectedFactory]);

  // Load packaging types when box quantity changes
  useEffect(() => {
    if (boxQty && selectedFactory?.packagingData) {
      const types = selectedFactory.packagingData
        .filter(item => 
          item.product === product && 
          item.prod_type === productType && 
          item.box_qty === boxQty && 
          item.pack
        )
        .map(item => item.pack);
      
      const uniqueTypes = Array.from(new Set(types.filter(Boolean))).sort();
      setPackagingTypes(uniqueTypes);
      
      if (uniqueTypes.length === 1) {
        onPackagingTypeChange(uniqueTypes[0]);
      } else if (!uniqueTypes.includes(packagingType)) {
        onPackagingTypeChange('');
      }
    } else {
      setPackagingTypes([]);
      onPackagingTypeChange('');
    }
  }, [boxQty, product, productType, selectedFactory]);

  // Load transport modes when packaging type changes
  useEffect(() => {
    if (packagingType && selectedFactory?.packagingData) {
      const modes = selectedFactory.packagingData
        .filter(item => 
          item.product === product && 
          item.prod_type === productType && 
          item.box_qty === boxQty && 
          item.pack === packagingType && 
          item.transport_mode
        )
        .map(item => item.transport_mode);
      
      const uniqueModes = Array.from(new Set(modes.filter(Boolean))).sort();
      setTransportModes(uniqueModes);
      
      if (uniqueModes.length === 1) {
        onTransportModeChange(uniqueModes[0]);
      } else if (!uniqueModes.includes(transportMode)) {
        onTransportModeChange('');
      }
    } else {
      setTransportModes([]);
      onTransportModeChange('');
    }
  }, [packagingType, product, productType, boxQty, selectedFactory]);

  // Update packaging rate when transport mode changes
  useEffect(() => {
    if (transportMode && selectedFactory?.packagingData) {
      const rate = selectedFactory.packagingData.find(item => 
        item.product === product && 
        item.prod_type === productType && 
        item.box_qty === boxQty && 
        item.pack === packagingType && 
        item.transport_mode === transportMode
      );

      if (rate) {
        onPackagingRateChange(rate.packaging_rate || 0);
      } else {
        onPackagingRateChange(0);
      }
      
      // Always use factory-level charges
      console.log('Factory charges from PackagingDetails:', {
        factoryId: selectedFactory.id,
        factoryName: selectedFactory.name,
        palletCharge: selectedFactory.palletCharge,
        terminalCharge: selectedFactory.terminalCharge
      });
      onPalletChargeChange(selectedFactory.palletCharge || 0);
      onTerminalChargeChange(selectedFactory.terminalCharge || 0);
    } else {
      onPackagingRateChange(0);
      // Still set charges if we have a factory selected
      if (selectedFactory) {
        console.log('Factory charges from PackagingDetails (no transport mode):', {
          factoryId: selectedFactory.id,
          factoryName: selectedFactory.name,
          palletCharge: selectedFactory.palletCharge,
          terminalCharge: selectedFactory.terminalCharge
        });
        onPalletChargeChange(selectedFactory.palletCharge || 0);
        onTerminalChargeChange(selectedFactory.terminalCharge || 0);
      } else {
        onPalletChargeChange(0);
        onTerminalChargeChange(0);
      }
    }
  }, [transportMode, product, productType, boxQty, packagingType, selectedFactory]);

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Packaging Details
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!product}>
          <InputLabel>Box Quantity</InputLabel>
          <Select
            value={boxQty}
            label="Box Quantity"
            onChange={(e) => onBoxQtyChange(e.target.value)}
            disabled={isSubmitting || !product}
          >
            {boxQuantities.map((qty) => (
              <MenuItem key={qty} value={qty}>{qty}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!boxQty}>
          <InputLabel>Packaging Type</InputLabel>
          <Select
            value={packagingType}
            label="Packaging Type"
            onChange={(e) => onPackagingTypeChange(e.target.value)}
            disabled={isSubmitting || !boxQty}
          >
            {packagingTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!packagingType}>
          <InputLabel>Transport Mode</InputLabel>
          <Select
            value={transportMode}
            label="Transport Mode"
            onChange={(e) => onTransportModeChange(e.target.value)}
            disabled={isSubmitting || !packagingType}
          >
            {transportModes.map((mode) => (
              <MenuItem key={mode} value={mode}>{mode}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="number"
          label="Packaging Rate"
          value={packagingRate}
          InputProps={{
            readOnly: true,
            inputProps: { min: 0, step: 0.01 }
          }}
          disabled={true}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>
    </>
  );
}; 