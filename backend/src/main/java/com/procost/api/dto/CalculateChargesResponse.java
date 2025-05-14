package com.procost.api.dto;

import java.util.Map;

public class CalculateChargesResponse {
    private Double palletCharge;
    private Double terminalCharge;
    private Map<String, Double> optionalCharges;
    private Double totalCompulsory;
    private Double totalOptional;
    private Double totalCharges;
    
    public CalculateChargesResponse(Double palletCharge, Double terminalCharge, 
                                    Map<String, Double> optionalCharges,
                                    Double totalCompulsory, Double totalOptional, 
                                    Double totalCharges) {
        this.palletCharge = palletCharge;
        this.terminalCharge = terminalCharge;
        this.optionalCharges = optionalCharges;
        this.totalCompulsory = totalCompulsory;
        this.totalOptional = totalOptional;
        this.totalCharges = totalCharges;
    }
    
    public Double getPalletCharge() {
        return palletCharge;
    }
    
    public void setPalletCharge(Double palletCharge) {
        this.palletCharge = palletCharge;
    }
    
    public Double getTerminalCharge() {
        return terminalCharge;
    }
    
    public void setTerminalCharge(Double terminalCharge) {
        this.terminalCharge = terminalCharge;
    }
    
    public Map<String, Double> getOptionalCharges() {
        return optionalCharges;
    }
    
    public void setOptionalCharges(Map<String, Double> optionalCharges) {
        this.optionalCharges = optionalCharges;
    }
    
    public Double getTotalCompulsory() {
        return totalCompulsory;
    }
    
    public void setTotalCompulsory(Double totalCompulsory) {
        this.totalCompulsory = totalCompulsory;
    }
    
    public Double getTotalOptional() {
        return totalOptional;
    }
    
    public void setTotalOptional(Double totalOptional) {
        this.totalOptional = totalOptional;
    }
    
    public Double getTotalCharges() {
        return totalCharges;
    }
    
    public void setTotalCharges(Double totalCharges) {
        this.totalCharges = totalCharges;
    }
}