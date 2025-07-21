import React, { useEffect } from 'react';
import { useFactory, ChargeRateOption } from '../../context/FactoryContext';

interface FilletingRateCalculatorProps {
  product: string;
  productType: string;
  trimType: string;
  onRateChange: (rate: number) => void;
}

export const FilletingRateCalculator: React.FC<FilletingRateCalculatorProps> = ({
  product,
  productType,
  trimType,
  onRateChange
}) => {
  const { selectedFactory } = useFactory();

  useEffect(() => {
    if (product && trimType && selectedFactory?.chargeRates) {
      const filletingRate = selectedFactory.chargeRates.find(rate => 
        rate.charge_name === 'Filleting Rate' &&
        rate.product_type === productType &&
        rate.product === product &&
        rate.subtype === trimType
      );

      if (filletingRate) {
        onRateChange(filletingRate.rate_value);
      } else {
        const generalFilletingRate = selectedFactory.chargeRates.find(rate => 
          rate.charge_name === 'Filleting Rate' &&
          rate.product_type === productType &&
          rate.product === product &&
          !rate.subtype
        );

        if (generalFilletingRate) {
          onRateChange(generalFilletingRate.rate_value);
        } else {
          onRateChange(0);
        }
      }
    } else {
      onRateChange(0);
    }
  }, [product, trimType, productType, selectedFactory, selectedFactory?.chargeRates, onRateChange]);

  return null; // This is a logic-only component
}; 