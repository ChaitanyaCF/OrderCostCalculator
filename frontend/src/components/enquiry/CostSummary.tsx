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
  isStorageRequired?: boolean;
  numberOfWeeks?: number;
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
  product,
  isStorageRequired = false,
  numberOfWeeks = 1.0
}) => {
  const getCurrencySymbol = () => selectedFactory?.currency || '$';

  const currencySymbol = getCurrencySymbol();

  // Calculate environmental and electricity fee amounts
  const calculateEnvironmentalFee = () => {
    if (!environmentalFeeEnabled || !selectedFactory?.environmentalFeePercentage) return 0;
    
    // Calculate subtotal for percentage calculation (everything except reception/dispatch fees and percentage fees)
    const filletingAmount = Number(filletingRate || 0) * Number(quantity || 0);
    const packageAmount = Number(packagingRate || 0) * Number(quantity || 0);
    const additionalCharges = Number(filingRate || 0) + Number(palletCharge || 0) + Number(terminalCharge || 0);
    const freezingAmount = productType === 'Frozen' && freezingRate > 0 ? Number(freezingRate || 0) : 0;
    const optionalTotal = optionalCharges.reduce((sum, charge) => sum + Number(charge.chargeValue || 0), 0);
    
    const subtotalForPercentage = filletingAmount + packageAmount + additionalCharges + freezingAmount + optionalTotal;
    return subtotalForPercentage * (Number(selectedFactory.environmentalFeePercentage) / 100);
  };

  const calculateElectricityFee = () => {
    if (!electricityFeeEnabled || !selectedFactory?.electricityFeePercentage) return 0;
    
    // Calculate subtotal for percentage calculation (everything except reception/dispatch fees and percentage fees)
    const filletingAmount = Number(filletingRate || 0) * Number(quantity || 0);
    const packageAmount = Number(packagingRate || 0) * Number(quantity || 0);
    const additionalCharges = Number(filingRate || 0) + Number(palletCharge || 0) + Number(terminalCharge || 0);
    const freezingAmount = productType === 'Frozen' && freezingRate > 0 ? Number(freezingRate || 0) : 0;
    const optionalTotal = optionalCharges.reduce((sum, charge) => sum + Number(charge.chargeValue || 0), 0);
    
    const subtotalForPercentage = filletingAmount + packageAmount + additionalCharges + freezingAmount + optionalTotal;
    return subtotalForPercentage * (Number(selectedFactory.electricityFeePercentage) / 100);
  };

  const environmentalFeeAmount = calculateEnvironmentalFee();
  const electricityFeeAmount = calculateElectricityFee();

  return (
    <Paper sx={{ p: 4, height: '100%' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Cost Summary
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Base Processing Charges
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Filleting</Typography>
          <Typography>{getCurrencySymbol()}{Number(filletingRate || 0).toFixed(2)}/kg</Typography>
        </Box>
        
        {/* Only show freezing in base charges when Frozen + freezing type selected */}
        {productType === 'Frozen' && freezingType && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Freezing</Typography>
            <Typography>{getCurrencySymbol()}{Number(freezingRate || 0).toFixed(2)}/kg</Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Packaging</Typography>
          <Typography>{getCurrencySymbol()}{Number(packagingRate || 0).toFixed(2)}/kg</Typography>
        </Box>
           
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Additional Charges
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
        

        
        {/* Only show Optional/Processing Charges section if there are any charges to display */}
        {((onToggleProdAB && onToggleDescaling && (optionalCharges.some(charge => charge.chargeName.includes('Fillet')) || product?.includes('Fillet'))) || 
          (onTogglePortionSkinOn && onTogglePortionSkinOff && (optionalCharges.some(charge => charge.chargeName.includes('Portion')) || product?.includes('Portion')))) && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {product?.toLowerCase().includes('portion') ? 'Processing Charges' : 'Optional Charges'}
            </Typography>
          </>
        )}
        
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
        
        {/* Only show Freezing Charges section when storage is required */}
        {productType === 'Frozen' && isStorageRequired && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Freezing Charges
            </Typography>
            
            {/* Reception Fee */}
            {onToggleReceptionFee && (
              <FormControlLabel 
                control={
                  <Switch 
                    checked={receptionFeeEnabled}
                    onChange={(e) => onToggleReceptionFee(e.target.checked)}
                    size="small"
                  />
                } 
                label={`Reception Fee (${currencySymbol}${Number(selectedFactory?.receptionFee || 0).toFixed(2)}/kg)`}
                sx={{ mb: 1 }}
              />
            )}
            
            {/* Dispatch Fee */}
            {onToggleDispatchFee && (
              <FormControlLabel 
                control={
                  <Switch 
                    checked={dispatchFeeEnabled}
                    onChange={(e) => onToggleDispatchFee(e.target.checked)}
                    size="small"
                  />
                } 
                label={`Dispatch Fee (${currencySymbol}${Number(selectedFactory?.dispatchFee || 0).toFixed(2)}/kg)`}
                sx={{ mb: 1 }}
              />
            )}
            
            {/* Environmental Fee */}
            {onToggleEnvironmentalFee && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                <Typography>{getCurrencySymbol()}{environmentalFeeAmount.toFixed(2)}</Typography>
              </Box>
            )}
            
            {/* Electricity Fee */}
            {onToggleElectricityFee && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                <Typography>{getCurrencySymbol()}{electricityFeeAmount.toFixed(2)}</Typography>
              </Box>
            )}
            
            {/* Storage Rate and Charge */}
            {selectedFactory?.storageRate && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Storage Rate Per Week</Typography>
                  <Typography>{getCurrencySymbol()}{Number(selectedFactory.storageRate).toFixed(2)}/kg</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Storage Charge ({Math.ceil(numberOfWeeks)} {Math.ceil(numberOfWeeks) === 1 ? 'week' : 'weeks'})</Typography>
                  <Typography>{getCurrencySymbol()}{(quantity * Math.ceil(numberOfWeeks) * selectedFactory.storageRate).toFixed(2)}</Typography>
                </Box>
              </>
            )}
          </>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Quantity:</Typography>
          <Typography>{quantity} kg</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontWeight: 'medium' }}>Cost per kg:</Typography>
          <Typography sx={{ fontWeight: 'medium' }}>
            {getCurrencySymbol()}{quantity > 0 ? (Number(totalCharges || 0) / quantity).toFixed(2) : '0.00'}/kg
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Total Cost:</Typography>
          <Typography variant="h6" color="primary">{getCurrencySymbol()}{Number(totalCharges || 0).toFixed(2)}</Typography>
        </Box>
      </Box>
    </Paper>
  );
}; 