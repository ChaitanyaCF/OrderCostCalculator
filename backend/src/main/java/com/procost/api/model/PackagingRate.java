package com.procost.api.model;

public class PackagingRate {
    private String prodType;
    private String product;
    private String packType;
    private String transportMode;
    private Double rate;
    
    public String getProdType() {
        return prodType;
    }
    
    public void setProdType(String prodType) {
        this.prodType = prodType;
    }
    
    public String getProduct() {
        return product;
    }
    
    public void setProduct(String product) {
        this.product = product;
    }
    
    public String getPackType() {
        return packType;
    }
    
    public void setPackType(String packType) {
        this.packType = packType;
    }
    
    public String getTransportMode() {
        return transportMode;
    }
    
    public void setTransportMode(String transportMode) {
        this.transportMode = transportMode;
    }
    
    public Double getRate() {
        return rate;
    }
    
    public void setRate(Double rate) {
        this.rate = rate;
    }
}