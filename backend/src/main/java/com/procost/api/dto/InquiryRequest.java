package com.procost.api.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.util.Map;

public class InquiryRequest {
    
    @NotBlank
    private String product;
    
    @NotBlank
    private String trimType;
    
    @NotBlank
    private String rmSpec;
    
    @NotNull
    @Positive
    private Double yieldValue;
    
    @NotBlank
    private String productType;
    
    @NotBlank
    private String packagingType;
    
    @NotBlank
    private String packagingSize;
    
    @NotBlank
    private String transportMode;
    
    private Double filingRate;
    
    private Double packagingRate;
    
    @NotNull
    @Positive
    private Double palletCharge;
    
    @NotNull
    @Positive
    private Double terminalCharge;
    
    private Map<String, Double> optionalCharges;
    
    @NotNull
    @Positive
    private Double totalCharges;
    
    public String getProduct() {
        return product;
    }
    
    public void setProduct(String product) {
        this.product = product;
    }
    
    public String getTrimType() {
        return trimType;
    }
    
    public void setTrimType(String trimType) {
        this.trimType = trimType;
    }
    
    public String getRmSpec() {
        return rmSpec;
    }
    
    public void setRmSpec(String rmSpec) {
        this.rmSpec = rmSpec;
    }
    
    public Double getYieldValue() {
        return yieldValue;
    }
    
    public void setYieldValue(Double yieldValue) {
        this.yieldValue = yieldValue;
    }
    
    public String getProductType() {
        return productType;
    }
    
    public void setProductType(String productType) {
        this.productType = productType;
    }
    
    public String getPackagingType() {
        return packagingType;
    }
    
    public void setPackagingType(String packagingType) {
        this.packagingType = packagingType;
    }
    
    public String getPackagingSize() {
        return packagingSize;
    }
    
    public void setPackagingSize(String packagingSize) {
        this.packagingSize = packagingSize;
    }
    
    public String getTransportMode() {
        return transportMode;
    }
    
    public void setTransportMode(String transportMode) {
        this.transportMode = transportMode;
    }
    
    public Double getFilingRate() {
        return filingRate;
    }
    
    public void setFilingRate(Double filingRate) {
        this.filingRate = filingRate;
    }
    
    public Double getPackagingRate() {
        return packagingRate;
    }
    
    public void setPackagingRate(Double packagingRate) {
        this.packagingRate = packagingRate;
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
    
    public Double getTotalCharges() {
        return totalCharges;
    }
    
    public void setTotalCharges(Double totalCharges) {
        this.totalCharges = totalCharges;
    }
}