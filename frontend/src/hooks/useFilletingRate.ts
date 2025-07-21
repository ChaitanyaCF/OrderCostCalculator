import { useEffect } from 'react';
import { useFactory } from '../context/FactoryContext';

export const useFilletingRate = (
  product: string,
  productType: string,
  trimType: string,
  onRateChange: (rate: number) => void
) => {
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
};

export default useFilletingRate; 