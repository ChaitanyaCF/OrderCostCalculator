package com.procost.api.model;

public class PackageEntry {
    private String prodType;
    private String product;
    private String packType;
    private String transportMode;
    private Double packagingRate;
    
    public PackageEntry() {
    }
    
    public PackageEntry(String prodType, String product, String packType, String transportMode, Double packagingRate) {
        this.prodType = prodType;
        this.product = product;
        this.packType = packType;
        this.transportMode = transportMode;
        this.packagingRate = packagingRate;
    }
    
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
    
    public Double getPackagingRate() {
        return packagingRate;
    }
    
    public void setPackagingRate(Double packagingRate) {
        this.packagingRate = packagingRate;
    }
}