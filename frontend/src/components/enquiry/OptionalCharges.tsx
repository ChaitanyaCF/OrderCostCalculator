import React, { useState } from 'react';
import {
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
  Box,
  Divider,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useFactory } from '../../context/FactoryContext';

export interface OptionalCharge {
  chargeName: string;
  chargeValue: number;
}

interface OptionalChargesProps {
  optionalCharges: OptionalCharge[];
  onAddCharge: (charge: OptionalCharge) => void;
  onRemoveCharge: (index: number) => void;
  isSubmitting: boolean;
  quantity?: number; // For per kg calculations
}

export const OptionalCharges: React.FC<OptionalChargesProps> = ({
  optionalCharges,
  onAddCharge,
  onRemoveCharge,
  isSubmitting,
  quantity
}) => {
  const [chargeName, setChargeName] = useState('');
  const [chargeValue, setChargeValue] = useState<string>('');
  const { selectedFactory } = useFactory();
  
  const currencySymbol = selectedFactory?.currency || '$';

  const handleAddCharge = () => {
    if (chargeName && chargeValue) {
      onAddCharge({
        chargeName,
        chargeValue: parseFloat(chargeValue)
      });
      setChargeName('');
      setChargeValue('');
    }
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Optional Charges
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Charge Name"
              value={chargeName}
              onChange={(e) => setChargeName(e.target.value)}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              type="number"
              label="Value"
              value={chargeValue}
              onChange={(e) => setChargeValue(e.target.value)}
              disabled={isSubmitting}
              InputProps={{
                inputProps: { min: 0, step: 0.01 }
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddCharge}
              disabled={!chargeName || !chargeValue || isSubmitting}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {optionalCharges.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {optionalCharges.map((charge, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ flexGrow: 1 }}>
                {charge.chargeName}: {currencySymbol}{charge.chargeValue.toFixed(2)}
              </Typography>
              <IconButton 
                color="error" 
                onClick={() => onRemoveCharge(index)}
                disabled={isSubmitting}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      
      {optionalCharges.length === 0 && (
        <Typography color="text.secondary">No optional charges added</Typography>
      )}
    </>
  );
}; 