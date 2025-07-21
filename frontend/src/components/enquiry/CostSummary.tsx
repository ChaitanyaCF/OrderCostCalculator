import React from 'react';
import { Box, Typography, Paper, Divider, Switch, FormControlLabel, FormGroup } from '@mui/material';
import { Factory } from '../../context/FactoryContext';

interface OptionalCharge {
  chargeName: string;
  chargeValue: number;
}

interface CostSummaryProps {
  selectedFactory: Factory | null;
  filletingRate: number;
  quantity: number;
  yieldValue: number;
  packagingRate: number;
  filingRate: number;
  palletCharge: number;
  terminalCharge: number;
  freezingRate: number;
  freezingType: string;
  productType: string;
  optionalCharges: OptionalCharge[];
  totalCharges: number;
  onToggleProdAB?: (isChecked: boolean) => void;
  onToggleDescaling?: (isChecked: boolean) => void;
  onTogglePortionSkinOn?: (isChecked: boolean) => void;
  onTogglePortionSkinOff?: (isChecked: boolean) => void;
  onTogglePalletCharge?: (isChecked: boolean) => void;
  onToggleTerminalCharge?: (isChecked: boolean) => void;
  onToggleReceptionFee?: (isChecked: boolean) => void;
  onToggleDispatchFee?: (isChecked: boolean) => void;
  onToggleEnvironmentalFee?: (isChecked: boolean) => void;
  onToggleElectricityFee?: (isChecked: boolean) => void;
  prodABEnabled?: boolean;
  descalingEnabled?: boolean;
  portionSkinOnEnabled?: boolean;
  portionSkinOffEnabled?: boolean;
  palletChargeEnabled?: boolean;
  terminalChargeEnabled?: boolean;
  receptionFeeEnabled?: boolean;
  dispatchFeeEnabled?: boolean;
  environmentalFeeEnabled?: boolean;
  electricityFeeEnabled?: boolean;
  product?: string;
}

export const CostSummary: React.FC<CostSummaryProps> = ({
  selectedFactory,
  filletingRate,
  quantity,
  yieldValue,
  packagingRate,
  filingRate,
  palletCharge,
  terminalCharge,
  freezingRate,
  freezingType,
  productType,
  optionalCharges,
  totalCharges,
  onToggleProdAB,
  onToggleDescaling,
  onTogglePortionSkinOn,
  onTogglePortionSkinOff,
  onTogglePalletCharge,
  onToggleTerminalCharge,
  onToggleReceptionFee,
  onToggleDispatchFee,
  onToggleEnvironmentalFee,
  onToggleElectricityFee,
  prodABEnabled = false,
  descalingEnabled = false,
  portionSkinOnEnabled = false,
  portionSkinOffEnabled = false,
  palletChargeEnabled = true,
  terminalChargeEnabled = true,
  receptionFeeEnabled = false,
  dispatchFeeEnabled = false,
  environmentalFeeEnabled = false,
  electricityFeeEnabled = false,
  product
}) => {
  const getCurrencySymbol = () => selectedFactory?.currency || '$';

  const currencySymbol = getCurrencySymbol();

  return (
    <Paper sx={{ p: 4, height: '100%' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Cost Summary
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Product Cost
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Filleting Rate (per kg):</Typography>
          <Typography>{getCurrencySymbol()}{Number(filletingRate || 0).toFixed(2)}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Subtotal:</Typography>
          <Typography>{getCurrencySymbol()}{Number(filletingRate || 0).toFixed(2)}</Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Packaging
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Packaging Rate:</Typography>
          <Typography>{getCurrencySymbol()}{Number(packagingRate || 0).toFixed(2)}</Typography>
        </Box>
           
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Compulsory Charges
        </Typography>
        
        {onTogglePalletCharge && onToggleTerminalCharge && (
          <FormGroup sx={{ mb: 2 }}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={palletChargeEnabled}
                  onChange={(e) => onTogglePalletCharge(e.target.checked)}
                  size="small"
                />
              } 
              label={`Pallet Charge (${currencySymbol}${Number(palletCharge || 0).toFixed(2)})`}
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={terminalChargeEnabled}
                  onChange={(e) => onToggleTerminalCharge(e.target.checked)}
                  size="small"
                />
              } 
              label={`Terminal Charge (${currencySymbol}${Number(terminalCharge || 0).toFixed(2)})`}
            />
          </FormGroup>
        )}
        
        {(!onTogglePalletCharge || !onToggleTerminalCharge) && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Pallet Charge:</Typography>
              <Typography>{getCurrencySymbol()}{Number(palletCharge || 0).toFixed(2)}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Terminal Charge:</Typography>
              <Typography>{getCurrencySymbol()}{Number(terminalCharge || 0).toFixed(2)}</Typography>
            </Box>
          </>
        )}
        
        {productType === 'Frozen' && onToggleReceptionFee && onToggleDispatchFee && onToggleEnvironmentalFee && onToggleElectricityFee && (
          <>
           
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Freezing Charges
            </Typography>
            
            {productType === 'Frozen' && freezingType && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>{freezingType} ({getCurrencySymbol()}{Number(freezingRate).toFixed(2)}/kg):</Typography>
            <Typography>{getCurrencySymbol()}{Number(freezingRate || 0).toFixed(2)}</Typography>
          </Box>
        )}
            
            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={receptionFeeEnabled}
                    onChange={(e) => onToggleReceptionFee(e.target.checked)}
                    size="small"
                  />
                } 
                label={`Reception Fee (${currencySymbol}${Number(selectedFactory?.receptionFee || 0).toFixed(2)})`}
              />
              <FormControlLabel 
                control={
                  <Switch 
                    checked={dispatchFeeEnabled}
                    onChange={(e) => onToggleDispatchFee(e.target.checked)}
                    size="small"
                  />
                } 
                label={`Dispatch Fee (${currencySymbol}${Number(selectedFactory?.dispatchFee || 0).toFixed(2)})`}
              />
              <FormControlLabel 
                control={
                  <Switch 
                    checked={environmentalFeeEnabled}
                    onChange={(e) => onToggleEnvironmentalFee(e.target.checked)}
                    size="small"
                  />
                } 
                label={`Environmental Fee (${Number(selectedFactory?.environmentalFeePercentage || 0).toFixed(1)}%)`}
              />
              <FormControlLabel 
                control={
                  <Switch 
                    checked={electricityFeeEnabled}
                    onChange={(e) => onToggleElectricityFee(e.target.checked)}
                    size="small"
                  />
                } 
                label={`Electricity Fee (${Number(selectedFactory?.electricityFeePercentage || 0).toFixed(1)}%)`}
              />
            </FormGroup>
          </>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Optional Charges
        </Typography>
        
        {onToggleProdAB && onToggleDescaling && (optionalCharges.some(charge => charge.chargeName.includes('Fillet')) || product?.includes('Fillet')) && (
          <FormGroup sx={{ mb: 2 }}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={prodABEnabled}
                  onChange={(e) => onToggleProdAB(e.target.checked)}
                  size="small"
                />
              } 
              label={`Prod A/B (${currencySymbol}1.00 per kg RM)`}
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={descalingEnabled}
                  onChange={(e) => onToggleDescaling(e.target.checked)}
                  size="small"
                />
              } 
              label={`Descaling (${currencySymbol}1.50 per kg RM)`}
            />
          </FormGroup>
        )}
        
        {onTogglePortionSkinOn && onTogglePortionSkinOff && (optionalCharges.some(charge => charge.chargeName.includes('Portion')) || product?.includes('Portion')) && (
          <FormGroup sx={{ mb: 2 }}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={portionSkinOnEnabled}
                  onChange={(e) => onTogglePortionSkinOn(e.target.checked)}
                  size="small"
                />
              } 
              label={`Portion Skin On (${currencySymbol}2.50 per kg)`}
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={portionSkinOffEnabled}
                  onChange={(e) => onTogglePortionSkinOff(e.target.checked)}
                  size="small"
                />
              } 
              label={`Portion Skin Off (${currencySymbol}3.00 per kg)`}
            />
          </FormGroup>
        )}
        
        {optionalCharges.length > 0 ? (
          optionalCharges
            .filter(charge => 
              !(charge.chargeName.includes('Prod A/B') || 
                charge.chargeName.includes('Descaling') ||
                charge.chargeName.includes('Portion Skin On') ||
                charge.chargeName.includes('Portion Skin Off'))
            )
            .map((charge, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>{charge.chargeName}:</Typography>
                <Typography>{getCurrencySymbol()}{Number(charge.chargeValue || 0).toFixed(2)}</Typography>
              </Box>
            ))
        ) : (
          <Typography color="text.secondary">No optional charges added</Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Total:</Typography>
          <Typography variant="h6" color="primary">{getCurrencySymbol()}{Number(totalCharges || 0).toFixed(2)}</Typography>
        </Box>
      </Box>
    </Paper>
  );
}; 