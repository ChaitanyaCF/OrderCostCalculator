package com.procost.api.model;

public class RateEntry {
    private String product;
    private String trimType;
    private String rmSpec;
    private Double ratePerKg;
    
    public RateEntry() {
    }
    
    public RateEntry(String product, String trimType, String rmSpec, Double ratePerKg) {
        this.product = product;
        this.trimType = trimType;
        this.rmSpec = rmSpec;
        this.ratePerKg = ratePerKg;
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
    
    public Double getRatePerKg() {
        return ratePerKg;
    }
    
    public void setRatePerKg(Double ratePerKg) {
        this.ratePerKg = ratePerKg;
    }
}