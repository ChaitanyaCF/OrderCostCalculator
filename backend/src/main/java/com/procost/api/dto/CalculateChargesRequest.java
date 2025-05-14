package com.procost.api.dto;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

public class CalculateChargesRequest {
    
    @NotNull
    @Positive
    private Double yieldValue;
    
    @NotNull
    @Positive
    private Double weight;
    
    private OptionsDto options;
    
    public Double getYieldValue() {
        return yieldValue;
    }
    
    public void setYieldValue(Double yieldValue) {
        this.yieldValue = yieldValue;
    }
    
    public Double getWeight() {
        return weight;
    }
    
    public void setWeight(Double weight) {
        this.weight = weight;
    }
    
    public OptionsDto getOptions() {
        return options;
    }
    
    public void setOptions(OptionsDto options) {
        this.options = options;
    }
    
    public static class OptionsDto {
        private boolean prodaB;
        private boolean encoding;
        
        public boolean isProdaB() {
            return prodaB;
        }
        
        public void setProdaB(boolean prodaB) {
            this.prodaB = prodaB;
        }
        
        public boolean isEncoding() {
            return encoding;
        }
        
        public void setEncoding(boolean encoding) {
            this.encoding = encoding;
        }
    }
}