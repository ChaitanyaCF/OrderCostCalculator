package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "packaging_rates")
public class PackagingRate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotBlank(message = "Product type cannot be blank")
    @Size(max = 100, message = "Product type cannot exceed 100 characters")
    private String prodType;
    
    @Column(nullable = false)
    @NotBlank(message = "Product cannot be blank")
    @Size(max = 100, message = "Product cannot exceed 100 characters")
    private String product;
    
    @Column(nullable = false)
    @NotBlank(message = "Box quantity cannot be blank")
    @Size(max = 100, message = "Box quantity cannot exceed 100 characters")
    private String boxQty;
    
    @Column(nullable = false)
    @NotBlank(message = "Pack cannot be blank")
    @Size(max = 100, message = "Pack cannot exceed 100 characters")
    private String pack;
    
    @Column(nullable = false)
    @NotBlank(message = "Transport mode cannot be blank")
    @Size(max = 100, message = "Transport mode cannot exceed 100 characters")
    private String transportMode;
    
    @Column(nullable = false)
    @NotNull(message = "Packaging rate cannot be null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Packaging rate must be greater than or equal to 0")
    private Double packagingRate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factory_id")
    @JsonBackReference
    private Factory factory;
    
    public PackagingRate() {
    }
    
    public PackagingRate(String prodType, String product, String boxQty, String pack, 
                        String transportMode, Double packagingRate) {
        this.prodType = prodType;
        this.product = product;
        this.boxQty = boxQty;
        this.pack = pack;
        this.transportMode = transportMode;
        this.packagingRate = packagingRate;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    public String getBoxQty() {
        return boxQty;
    }
    
    public void setBoxQty(String boxQty) {
        this.boxQty = boxQty;
    }
    
    public String getPack() {
        return pack;
    }
    
    public void setPack(String pack) {
        this.pack = pack;
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
    
    public Factory getFactory() {
        return factory;
    }
    
    public void setFactory(Factory factory) {
        this.factory = factory;
    }
}