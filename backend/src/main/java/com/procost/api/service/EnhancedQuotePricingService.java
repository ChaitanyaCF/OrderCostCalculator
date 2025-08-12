package com.procost.api.service;

import com.procost.api.model.ChargeRate;
import com.procost.api.model.EnquiryItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EnhancedQuotePricingService {
    
    private static final Logger logger = LoggerFactory.getLogger(EnhancedQuotePricingService.class);
    private static final Long DEFAULT_FACTORY_ID = 1L; // Skagerak factory
    
    @Autowired
    private DataLoaderService dataLoaderService;
    
    @Autowired
    private ChargeRateService chargeRateService;
    
    public QuotePricing calculateTotalPricing(EnquiryItem item, Long factoryId) {
        logger.info("Calculating pricing for item: {} at factory: {}", item.getProduct(), factoryId);
        
        QuotePricing pricing = new QuotePricing();
        
        // 1. Base processing rate (filing rate)
        Double processingRate = dataLoaderService.calculateFilingRate(
            item.getProduct(), 
            item.getTrimType(), 
            item.getRmSpec()
        );
        pricing.setProcessingRate(processingRate != null ? processingRate : 0.0);
        logger.debug("Processing rate: {}", processingRate);
        
        // 2. Packaging rate
        Double packagingRate = dataLoaderService.calculatePackagingRate(
            item.getProductType(), 
            item.getProduct(), 
            item.getPackagingType(), 
            item.getTransportMode()
        );
        pricing.setPackagingRate(packagingRate != null ? packagingRate : 0.0);
        logger.debug("Packaging rate: {}", packagingRate);
        
        // 3. Freezing rate (if frozen product)
        Double freezingRate = 0.0;
        if ("Frozen".equalsIgnoreCase(item.getProductType())) {
            String freezingMethod = determineFreezingMethod(item);
            Optional<ChargeRate> freezingChargeOpt = chargeRateService.getSpecificChargeRate(
                factoryId, "Freezing Rate", "Frozen", item.getProduct(), freezingMethod
            );
            if (freezingChargeOpt.isPresent()) {
                freezingRate = freezingChargeOpt.get().getRateValue();
                logger.debug("Freezing rate ({} method): {}", freezingMethod, freezingRate);
            }
        }
        pricing.setFreezingRate(freezingRate);
        
        // 4. Filleting rate (if filleted product)
        Double filletingRate = 0.0;
        if (item.getTrimType() != null && item.getTrimType().toLowerCase().contains("fillet")) {
            Optional<ChargeRate> filletingChargeOpt = chargeRateService.getSpecificChargeRate(
                factoryId, "Filleting Rate", item.getProductType(), item.getProduct(), "Fillet"
            );
            if (filletingChargeOpt.isPresent()) {
                filletingRate = filletingChargeOpt.get().getRateValue();
                logger.debug("Filleting rate: {}", filletingRate);
            }
        }
        pricing.setFilletingRate(filletingRate);
        
        // 5. Pallet charge
        Double palletCharge = 0.0;
        Optional<ChargeRate> palletChargeOpt = chargeRateService.getSpecificChargeRate(
            factoryId, "Pallet Charge", item.getProductType(), item.getProduct(), ""
        );
        if (palletChargeOpt.isPresent()) {
            palletCharge = palletChargeOpt.get().getRateValue();
        }
        pricing.setPalletCharge(palletCharge);
        logger.debug("Pallet charge: {}", palletCharge);
        
        // 6. Terminal charge
        Double terminalCharge = 0.0;
        Optional<ChargeRate> terminalChargeOpt = chargeRateService.getSpecificChargeRate(
            factoryId, "Terminal Charge", item.getProductType(), item.getProduct(), ""
        );
        if (terminalChargeOpt.isPresent()) {
            terminalCharge = terminalChargeOpt.get().getRateValue();
        }
        pricing.setTerminalCharge(terminalCharge);
        logger.debug("Terminal charge: {}", terminalCharge);
        
        // 7. Skagerrak handling (factory-specific)
        Double handlingCharge = 0.0;
        Optional<ChargeRate> handlingChargeOpt = chargeRateService.getSpecificChargeRate(
            factoryId, "Skagerrak Handling", item.getProductType(), item.getProduct(), ""
        );
        if (handlingChargeOpt.isPresent()) {
            handlingCharge = handlingChargeOpt.get().getRateValue();
        }
        pricing.setHandlingCharge(handlingCharge);
        logger.debug("Handling charge: {}", handlingCharge);
        
        // Calculate total unit price
        Double totalUnitPrice = pricing.getProcessingRate() + 
                               pricing.getPackagingRate() + 
                               pricing.getFreezingRate() + 
                               pricing.getFilletingRate() + 
                               pricing.getPalletCharge() + 
                               pricing.getTerminalCharge() + 
                               pricing.getHandlingCharge();
        
        pricing.setTotalUnitPrice(totalUnitPrice);
        
        // Calculate total price for quantity
        Integer quantity = item.getRequestedQuantity() != null ? item.getRequestedQuantity() : 1;
        pricing.setTotalPrice(totalUnitPrice * quantity);
        pricing.setQuantity(quantity);
        
        logger.info("Total pricing calculated - Unit: {}, Total: {} for {} kg", 
                   totalUnitPrice, pricing.getTotalPrice(), quantity);
        
        return pricing;
    }
    
    private String determineFreezingMethod(EnquiryItem item) {
        // Logic to determine freezing method based on item specifications
        // This could be enhanced to check special instructions or other fields
        String specialInstructions = item.getSpecialInstructions();
        if (specialInstructions != null) {
            if (specialInstructions.toLowerCase().contains("gyro")) {
                return "Gyro Freezing";
            } else if (specialInstructions.toLowerCase().contains("tunnel")) {
                return "Tunnel Freezing";
            }
        }
        
        // Default to tunnel freezing if not specified
        return "Tunnel Freezing";
    }
    
    // Pricing result class
    public static class QuotePricing {
        private Double processingRate = 0.0;
        private Double packagingRate = 0.0;
        private Double freezingRate = 0.0;
        private Double filletingRate = 0.0;
        private Double palletCharge = 0.0;
        private Double terminalCharge = 0.0;
        private Double handlingCharge = 0.0;
        private Double totalUnitPrice = 0.0;
        private Double totalPrice = 0.0;
        private Integer quantity = 1;
        
        // Getters and setters
        public Double getProcessingRate() { return processingRate; }
        public void setProcessingRate(Double processingRate) { this.processingRate = processingRate; }
        
        public Double getPackagingRate() { return packagingRate; }
        public void setPackagingRate(Double packagingRate) { this.packagingRate = packagingRate; }
        
        public Double getFreezingRate() { return freezingRate; }
        public void setFreezingRate(Double freezingRate) { this.freezingRate = freezingRate; }
        
        public Double getFilletingRate() { return filletingRate; }
        public void setFilletingRate(Double filletingRate) { this.filletingRate = filletingRate; }
        
        public Double getPalletCharge() { return palletCharge; }
        public void setPalletCharge(Double palletCharge) { this.palletCharge = palletCharge; }
        
        public Double getTerminalCharge() { return terminalCharge; }
        public void setTerminalCharge(Double terminalCharge) { this.terminalCharge = terminalCharge; }
        
        public Double getHandlingCharge() { return handlingCharge; }
        public void setHandlingCharge(Double handlingCharge) { this.handlingCharge = handlingCharge; }
        
        public Double getTotalUnitPrice() { return totalUnitPrice; }
        public void setTotalUnitPrice(Double totalUnitPrice) { this.totalUnitPrice = totalUnitPrice; }
        
        public Double getTotalPrice() { return totalPrice; }
        public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
        
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
} 