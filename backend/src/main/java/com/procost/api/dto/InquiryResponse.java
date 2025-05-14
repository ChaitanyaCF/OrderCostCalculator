package com.procost.api.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class InquiryResponse {
    private Long id;
    private Long userId;
    private String product;
    private String trimType;
    private String rmSpec;
    private Double yieldValue;
    private String productType;
    private String packagingType;
    private String packagingSize;
    private String transportMode;
    private Double filingRate;
    private Double packagingRate;
    private Double palletCharge;
    private Double terminalCharge;
    private Map<String, Double> optionalCharges;
    private Double totalCharges;
    private LocalDateTime createdAt;
    
    public InquiryResponse(Long id, Long userId, String product, String trimType, String rmSpec,
                          Double yieldValue, String productType, String packagingType,
                          String packagingSize, String transportMode, Double filingRate,
                          Double packagingRate, Double palletCharge, Double terminalCharge,
                          Map<String, Double> optionalCharges, Double totalCharges,
                          LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.product = product;
        this.trimType = trimType;
        this.rmSpec = rmSpec;
        this.yieldValue = yieldValue;
        this.productType = productType;
        this.packagingType = packagingType;
        this.packagingSize = packagingSize;
        this.transportMode = transportMode;
        this.filingRate = filingRate;
        this.packagingRate = packagingRate;
        this.palletCharge = palletCharge;
        this.terminalCharge = terminalCharge;
        this.optionalCharges = optionalCharges;
        this.totalCharges = totalCharges;
        this.createdAt = createdAt;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
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
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}