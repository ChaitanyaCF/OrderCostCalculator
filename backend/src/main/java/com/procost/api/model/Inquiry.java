package com.procost.api.model;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "inquiries")
public class Inquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String product;
    
    @Column(nullable = false)
    private String trimType;
    
    @Column(nullable = false)
    private String rmSpec;
    
    @Column(nullable = false)
    private Double yieldValue;
    
    @Column(nullable = false)
    private String productType;
    
    @Column(nullable = false)
    private String packagingType;
    
    @Column(nullable = false)
    private String packagingSize;
    
    @Column(nullable = false)
    private String transportMode;
    
    private Double filingRate;
    
    private Double packagingRate;
    
    @Column(nullable = false)
    private Double palletCharge;
    
    @Column(nullable = false)
    private Double terminalCharge;
    
    @ElementCollection
    @CollectionTable(name = "inquiry_optional_charges", 
                      joinColumns = @JoinColumn(name = "inquiry_id"))
    @MapKeyColumn(name = "charge_name")
    @Column(name = "charge_value")
    private Map<String, Double> optionalCharges;
    
    @Column(nullable = false)
    private Double totalCharges;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
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