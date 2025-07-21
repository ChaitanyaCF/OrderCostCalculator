package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "rate_tables")
public class RateTable {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotBlank(message = "Product cannot be blank")
    @Size(max = 100, message = "Product name cannot exceed 100 characters")
    private String product;
    
    @Column(nullable = false)
    @NotBlank(message = "Trim type cannot be blank")
    @Size(max = 100, message = "Trim type cannot exceed 100 characters")
    private String trimType;
    
    @Column(nullable = false)
    @NotBlank(message = "RM specification cannot be blank")
    @Size(max = 100, message = "RM specification cannot exceed 100 characters")
    private String rmSpec;
    
    @Column(nullable = false)
    @NotNull(message = "Rate per kg cannot be null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Rate per kg must be greater than or equal to 0")
    private Double ratePerKg;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factory_id")
    @JsonBackReference
    private Factory factory;
    
    public RateTable() {
    }
    
    public RateTable(String product, String trimType, String rmSpec, Double ratePerKg) {
        this.product = product;
        this.trimType = trimType;
        this.rmSpec = rmSpec;
        this.ratePerKg = ratePerKg;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    public Factory getFactory() {
        return factory;
    }
    
    public void setFactory(Factory factory) {
        this.factory = factory;
    }
}