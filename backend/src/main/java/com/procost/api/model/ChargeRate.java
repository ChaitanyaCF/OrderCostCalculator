package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "charge_rates")
public class ChargeRate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotBlank(message = "Charge name cannot be blank")
    @Size(max = 100, message = "Charge name cannot exceed 100 characters")
    private String chargeName;
    
    @Column(nullable = false)
    @NotBlank(message = "Product type cannot be blank")
    @Size(max = 100, message = "Product type cannot exceed 100 characters")
    private String productType;
    
    @Column(nullable = false)
    @NotBlank(message = "Product cannot be blank")
    @Size(max = 100, message = "Product cannot exceed 100 characters")
    private String product;
    
    @Column(nullable = true)
    @Size(max = 100, message = "Subtype cannot exceed 100 characters")
    private String subtype;
    
    @Column(nullable = false)
    @NotNull(message = "Rate value cannot be null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Rate value must be greater than or equal to 0")
    private Double rateValue;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factory_id")
    @JsonBackReference
    private Factory factory;
    
    public ChargeRate() {
    }
    
    public ChargeRate(String chargeName, String productType, String product, String subtype, Double rateValue) {
        this.chargeName = chargeName;
        this.productType = productType;
        this.product = product;
        this.subtype = subtype;
        this.rateValue = rateValue;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getChargeName() {
        return chargeName;
    }
    
    public void setChargeName(String chargeName) {
        this.chargeName = chargeName;
    }
    
    public String getProductType() {
        return productType;
    }
    
    public void setProductType(String productType) {
        this.productType = productType;
    }
    
    public String getProduct() {
        return product;
    }
    
    public void setProduct(String product) {
        this.product = product;
    }
    
    public String getSubtype() {
        return subtype;
    }
    
    public void setSubtype(String subtype) {
        this.subtype = subtype;
    }
    
    public Double getRateValue() {
        return rateValue;
    }
    
    public void setRateValue(Double rateValue) {
        this.rateValue = rateValue;
    }
    
    public Factory getFactory() {
        return factory;
    }
    
    public void setFactory(Factory factory) {
        this.factory = factory;
    }
} 