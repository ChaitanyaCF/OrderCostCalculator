package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "factories")
public class Factory {
    
    private static final Logger logger = LoggerFactory.getLogger(Factory.class);
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotBlank(message = "Factory name cannot be blank")
    @Size(max = 255, message = "Factory name cannot exceed 255 characters")
    private String name;
    
    @Column(nullable = false)
    @NotBlank(message = "Factory location cannot be blank")
    @Size(max = 255, message = "Factory location cannot exceed 255 characters")
    private String location;
    
    @Column(nullable = false)
    @NotBlank(message = "Currency cannot be blank")
    @Size(max = 3, message = "Currency code cannot exceed 3 characters")
    private String currency = "USD";
    
    @Column(nullable = true)
    @DecimalMin(value = "0.0", inclusive = true, message = "Pallet charge must be greater than or equal to 0")
    private Double palletCharge = 0.0;
    
    @Column(nullable = true)
    @DecimalMin(value = "0.0", inclusive = true, message = "Terminal charge must be greater than or equal to 0")
    private Double terminalCharge = 0.0;
    
    @Column(nullable = true)
    @DecimalMin(value = "0.0", inclusive = true, message = "Reception fee must be greater than or equal to 0")
    private Double receptionFee = 0.0;
    
    @Column(nullable = true)
    @DecimalMin(value = "0.0", inclusive = true, message = "Dispatch fee must be greater than or equal to 0")
    private Double dispatchFee = 0.0;
    
    @Column(nullable = true)
    @DecimalMin(value = "0.0", inclusive = true, message = "Environmental fee percentage must be greater than or equal to 0")
    private Double environmentalFeePercentage = 0.0;
    
    @Column(nullable = true)
    @DecimalMin(value = "0.0", inclusive = true, message = "Electricity fee percentage must be greater than or equal to 0")
    private Double electricityFeePercentage = 0.0;
    
    @OneToMany(mappedBy = "factory", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<PackagingRate> packagingRates = new ArrayList<>();
    
    @OneToMany(mappedBy = "factory", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<RateTable> rateTables = new ArrayList<>();
    
    @OneToMany(mappedBy = "factory", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ChargeRate> chargeRates = new ArrayList<>();
    
    public Factory() {
    }
    
    public Factory(String name, String location) {
        this.name = name;
        this.location = location;
    }
    
    public Factory(String name, String location, String currency) {
        this.name = name;
        this.location = location;
        this.currency = currency;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
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
    
    public Double getReceptionFee() {
        return receptionFee;
    }
    
    public void setReceptionFee(Double receptionFee) {
        this.receptionFee = receptionFee;
    }
    
    public Double getDispatchFee() {
        return dispatchFee;
    }
    
    public void setDispatchFee(Double dispatchFee) {
        this.dispatchFee = dispatchFee;
    }
    
    public Double getEnvironmentalFeePercentage() {
        return environmentalFeePercentage;
    }
    
    public void setEnvironmentalFeePercentage(Double environmentalFeePercentage) {
        this.environmentalFeePercentage = environmentalFeePercentage;
    }
    
    public Double getElectricityFeePercentage() {
        return electricityFeePercentage;
    }
    
    public void setElectricityFeePercentage(Double electricityFeePercentage) {
        this.electricityFeePercentage = electricityFeePercentage;
    }
    
    public List<PackagingRate> getPackagingRates() {
        return packagingRates;
    }
    
    public void setPackagingRates(List<PackagingRate> packagingRates) {
        this.packagingRates = packagingRates;
    }
    
    public List<RateTable> getRateTables() {
        return rateTables;
    }
    
    public void setRateTables(List<RateTable> rateTables) {
        this.rateTables = rateTables;
    }
    
    public List<ChargeRate> getChargeRates() {
        return chargeRates;
    }
    
    public void setChargeRates(List<ChargeRate> chargeRates) {
        this.chargeRates = chargeRates;
    }
    
    public void addPackagingRate(PackagingRate packagingRate) {
        if (packagingRate == null) {
            logger.warn("Attempted to add null packaging rate");
            return;
        }
        
        logger.debug("Adding packaging rate: {}, {}", packagingRate.getProdType(), packagingRate.getProduct());
        
        // Ensure packaging rate isn't already in the list
        for (PackagingRate existingRate : packagingRates) {
            if (existingRate == packagingRate) {
                logger.debug("Packaging rate already in list, skipping");
                return;
            }
        }
        
        packagingRates.add(packagingRate);
        packagingRate.setFactory(this);
        logger.debug("Packaging rate added successfully");
    }
    
    public void removePackagingRate(PackagingRate packagingRate) {
        packagingRates.remove(packagingRate);
        packagingRate.setFactory(null);
    }
    
    public void addRateTable(RateTable rateTable) {
        if (rateTable == null) {
            logger.warn("Attempted to add null rate table");
            return;
        }
        
        logger.debug("Adding rate table: {}, {}", rateTable.getProduct(), rateTable.getTrimType());
        
        // Ensure rate table isn't already in the list
        for (RateTable existingRate : rateTables) {
            if (existingRate == rateTable) {
                logger.debug("Rate table already in list, skipping");
                return;
            }
        }
        
        rateTables.add(rateTable);
        rateTable.setFactory(this);
        logger.debug("Rate table added successfully");
    }
    
    public void removeRateTable(RateTable rateTable) {
        rateTables.remove(rateTable);
        rateTable.setFactory(null);
    }
    
    public void addChargeRate(ChargeRate chargeRate) {
        if (chargeRate == null) {
            logger.warn("Attempted to add null charge rate");
            return;
        }
        
        logger.debug("Adding charge rate: {}, {}", chargeRate.getChargeName(), chargeRate.getProduct());
        
        // Ensure charge rate isn't already in the list
        for (ChargeRate existingRate : chargeRates) {
            if (existingRate == chargeRate) {
                logger.debug("Charge rate already in list, skipping");
                return;
            }
        }
        
        chargeRates.add(chargeRate);
        chargeRate.setFactory(this);
        logger.debug("Charge rate added successfully");
    }
    
    public void removeChargeRate(ChargeRate chargeRate) {
        chargeRates.remove(chargeRate);
        chargeRate.setFactory(null);
    }
} 