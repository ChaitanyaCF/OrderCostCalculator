package com.procost.api.controller;

import com.procost.api.model.ErrorResponse;
import com.procost.api.model.Factory;
import com.procost.api.model.PackagingRate;
import com.procost.api.model.RateTable;
import com.procost.api.model.ChargeRate;
import com.procost.api.repository.PackagingRateRepository;
import com.procost.api.repository.RateTableRepository;
import com.procost.api.repository.ChargeRateRepository;
import com.procost.api.service.FactoryService;
import com.procost.api.service.ChargeRateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/factories")
@Validated  // Enable validation for path variables
public class FactoryController {

    private static final Logger logger = LoggerFactory.getLogger(FactoryController.class);
    
    private final FactoryService factoryService;
    private final PackagingRateRepository packagingRateRepository;
    private final RateTableRepository rateTableRepository;
    private final ChargeRateRepository chargeRateRepository;
    private final ChargeRateService chargeRateService;

    @Autowired
    public FactoryController(FactoryService factoryService, 
                            PackagingRateRepository packagingRateRepository,
                            RateTableRepository rateTableRepository,
                            ChargeRateRepository chargeRateRepository,
                            ChargeRateService chargeRateService) {
        this.factoryService = factoryService;
        this.packagingRateRepository = packagingRateRepository;
        this.rateTableRepository = rateTableRepository;
        this.chargeRateRepository = chargeRateRepository;
        this.chargeRateService = chargeRateService;
    }

    @GetMapping
    public ResponseEntity<?> getAllFactories() {
        try {
            List<Factory> factories = factoryService.getAllFactories();
            return ResponseEntity.ok(factories);
        } catch (Exception e) {
            // Log the error
            logger.error("Error retrieving factories: {}", e.getMessage(), e);
            
            // Create error response object
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("timestamp", LocalDateTime.now());
            errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            errorResponse.put("error", "Internal Server Error");
            errorResponse.put("message", "Error retrieving factories: " + e.getMessage());
            
            // Return a proper 500 error response
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Factory> getFactoryById(
            @PathVariable @NotNull @Min(1) Long id) {
        Optional<Factory> factory = factoryService.getFactoryById(id);
        return factory.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Factory> createFactory(@Valid @RequestBody Factory factory) {
        Factory createdFactory = factoryService.createFactory(factory);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdFactory);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Factory> updateFactory(
            @PathVariable @NotNull @Min(1) Long id, 
            @Valid @RequestBody Factory factory) {
        if (!factoryService.getFactoryById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        factory.setId(id);
        return ResponseEntity.ok(factoryService.updateFactory(factory));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFactory(
            @PathVariable @NotNull @Min(1) Long id) {
        if (!factoryService.getFactoryById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        factoryService.deleteFactory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/packaging-rates")
    public ResponseEntity<List<PackagingRate>> getPackagingRates(
            @PathVariable @NotNull @Min(1) Long id) {
        try {
            logger.debug("Retrieving all packaging rates for factory id: {}", id);
            List<PackagingRate> rates = factoryService.getPackagingRates(id);
            logger.debug("Retrieved {} packaging rates for factory id: {}", rates.size(), id);
            
            // Log the first few items for debugging
            if (rates.size() > 0 && logger.isDebugEnabled()) {
                logger.debug("Sample of packaging rates:");
                for (int i = 0; i < Math.min(rates.size(), 3); i++) {
                    PackagingRate rate = rates.get(i);
                    logger.debug("Rate {}: prodType={}, product={}, packagingRate={}", 
                        i, rate.getProdType(), rate.getProduct(), rate.getPackagingRate());
                }
            }
            
            return ResponseEntity.ok(rates);
        } catch (RuntimeException e) {
            // Log the error
            logger.error("Error retrieving packaging rates: {}", e.getMessage(), e);
            // Return a proper error code
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(null);
        } catch (Exception e) {
            // Log the error
            logger.error("Error retrieving packaging rates: {}", e.getMessage(), e);
            // Return a proper 500 error
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }

    @GetMapping("/{id}/rate-tables")
    public ResponseEntity<List<RateTable>> getRateTables(
            @PathVariable @NotNull @Min(1) Long id) {
        try {
            logger.debug("Retrieving all rate tables for factory id: {}", id);
            List<RateTable> rates = factoryService.getRateTables(id);
            logger.debug("Retrieved {} rate tables for factory id: {}", rates.size(), id);
            
            // Log the first few items for debugging
            if (rates.size() > 0 && logger.isDebugEnabled()) {
                logger.debug("Sample of rate tables:");
                for (int i = 0; i < Math.min(rates.size(), 3); i++) {
                    RateTable rate = rates.get(i);
                    logger.debug("Rate {}: product={}, trimType={}, ratePerKg={}", 
                        i, rate.getProduct(), rate.getTrimType(), rate.getRatePerKg());
                }
            }
            
            return ResponseEntity.ok(rates);
        } catch (RuntimeException e) {
            // Log the error
            logger.error("Error retrieving rate tables: {}", e.getMessage(), e);
            // Return a proper error code
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(null);
        } catch (Exception e) {
            // Log the error
            logger.error("Error retrieving rate tables: {}", e.getMessage(), e);
            // Return a proper 500 error
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }

    @PostMapping("/{id}/packaging-rates")
    public ResponseEntity<?> savePackagingRates(
            @PathVariable @NotNull @Min(1) Long id, 
            @Valid @RequestBody List<PackagingRate> packagingRates) {
        try {
            logger.info("==========================================================");
            logger.info("SAVE PACKAGING RATES REQUEST RECEIVED");
            logger.info("Received request to save packaging rates for factory ID: {}", id);
            logger.info("Received {} packaging rates", packagingRates.size());
            
            // Log request headers and authentication info
            logger.info("Request processing started");
            
            // Log all data received
            if (logger.isDebugEnabled()) {
                for (int i = 0; i < packagingRates.size(); i++) {
                    PackagingRate rate = packagingRates.get(i);
                    logger.debug("Rate {}: prodType={}, product={}, boxQty={}, pack={}, transportMode={}, packagingRate={}", 
                        i, rate.getProdType(), rate.getProduct(), rate.getBoxQty(), 
                        rate.getPack(), rate.getTransportMode(), rate.getPackagingRate());
                }
            }
            
            // Call service method
            Factory factory = factoryService.savePackagingRates(id, packagingRates);
            logger.info("Successfully saved packaging rates for factory: {}", factory.getName());
            logger.info("==========================================================");
            
            // Return response without hardcoded CORS headers
            return ResponseEntity.ok(factory);
        } catch (RuntimeException e) {
            logger.error("==========================================================");
            logger.error("ERROR SAVING PACKAGING RATES");
            logger.error("Error saving packaging rates: {}", e.getMessage(), e);
            
            // Create error response
            ErrorResponse errorResponse = new ErrorResponse();
            errorResponse.setStatus(HttpStatus.BAD_REQUEST.value());
            errorResponse.setMessage("Error saving packaging rates: " + e.getMessage());
            errorResponse.setTimestamp(LocalDateTime.now());
            
            logger.error("Returning error response");
            logger.error("==========================================================");
            
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("==========================================================");
            logger.error("ERROR SAVING PACKAGING RATES");
            logger.error("Error saving packaging rates: {}", e.getMessage(), e);
            
            // Create error response
            ErrorResponse errorResponse = new ErrorResponse();
            errorResponse.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            errorResponse.setMessage("Error saving packaging rates: " + e.getMessage());
            errorResponse.setTimestamp(LocalDateTime.now());
            
            logger.error("Returning error response");
            logger.error("==========================================================");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/{id}/rate-tables")
    public ResponseEntity<?> saveRateTables(@PathVariable Long id, @RequestBody List<RateTable> rateTables) {
        try {
            logger.info("==========================================================");
            logger.info("SAVE RATE TABLES REQUEST RECEIVED");
            logger.info("Received request to save rate tables for factory ID: {}", id);
            logger.info("Received {} rate tables", rateTables.size());
            
            // Log request headers and authentication info
            logger.info("Request processing started");
            
            // Log all data received
            if (logger.isDebugEnabled()) {
                for (int i = 0; i < rateTables.size(); i++) {
                    RateTable rate = rateTables.get(i);
                    logger.debug("Rate {}: product={}, trimType={}, rmSpec={}, ratePerKg={}", 
                        i, rate.getProduct(), rate.getTrimType(), rate.getRmSpec(), rate.getRatePerKg());
                }
            }
            
            // Call service method
            Factory factory = factoryService.saveRateTables(id, rateTables);
            logger.info("Successfully saved rate tables for factory: {}", factory.getName());
            logger.info("==========================================================");
            
            // Return response
            return ResponseEntity.ok(factory);
        } catch (Exception e) {
            logger.error("Error saving rate tables: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/all-packaging-rates")
    public ResponseEntity<List<PackagingRate>> getAllPackagingRates(@PathVariable Long id) {
        try {
            logger.debug("Using new endpoint to retrieve ALL packaging rates for factory id: {}", id);
            
            // Use repository directly for a simplified query
            List<PackagingRate> rates = packagingRateRepository.findAllByFactoryId(id);
            
            logger.debug("Retrieved {} packaging rates using direct repository method", rates.size());
            
            // Log the first few items for debugging
            if (rates.size() > 0 && logger.isDebugEnabled()) {
                logger.debug("Sample of packaging rates:");
                for (int i = 0; i < Math.min(rates.size(), 3); i++) {
                    PackagingRate rate = rates.get(i);
                    logger.debug("Rate {}: prodType={}, product={}, packagingRate={}", 
                        i, rate.getProdType(), rate.getProduct(), rate.getPackagingRate());
                }
            }
            
            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            logger.error("Error retrieving all packaging rates: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}/all-rate-tables")
    public ResponseEntity<List<RateTable>> getAllRateTables(@PathVariable Long id) {
        try {
            logger.debug("Using new endpoint to retrieve ALL rate tables for factory id: {}", id);
            
            // Use repository directly for a simplified query
            List<RateTable> rates = rateTableRepository.findAllByFactoryId(id);
            
            logger.debug("Retrieved {} rate tables using direct repository method", rates.size());
            
            // Log the first few items for debugging
            if (rates.size() > 0 && logger.isDebugEnabled()) {
                logger.debug("Sample of rate tables:");
                for (int i = 0; i < Math.min(rates.size(), 3); i++) {
                    RateTable rate = rates.get(i);
                    logger.debug("Rate {}: product={}, trimType={}, ratePerKg={}", 
                        i, rate.getProduct(), rate.getTrimType(), rate.getRatePerKg());
                }
            }
            
            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            logger.error("Error retrieving all rate tables: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}/charge-rates")
    public ResponseEntity<List<ChargeRate>> getChargeRates(
            @PathVariable @NotNull @Min(1) Long id) {
        try {
            logger.debug("Retrieving all charge rates for factory id: {}", id);
            List<ChargeRate> rates = chargeRateService.getChargeRatesByFactory(id);
            logger.debug("Retrieved {} charge rates for factory id: {}", rates.size(), id);
            
            // Log the first few items for debugging
            if (rates.size() > 0 && logger.isDebugEnabled()) {
                logger.debug("Sample of charge rates:");
                for (int i = 0; i < Math.min(rates.size(), 3); i++) {
                    ChargeRate rate = rates.get(i);
                    logger.debug("Rate {}: chargeName={}, product={}, rateValue={}", 
                        i, rate.getChargeName(), rate.getProduct(), rate.getRateValue());
                }
            }
            
            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            logger.error("Error retrieving charge rates: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/{id}/charge-rates")
    public ResponseEntity<?> saveChargeRates(
            @PathVariable @NotNull @Min(1) Long id, 
            @Valid @RequestBody List<ChargeRate> chargeRates) {
        try {
            logger.info("==========================================================");
            logger.info("SAVE CHARGE RATES REQUEST RECEIVED");
            logger.info("Received request to save charge rates for factory ID: {}", id);
            logger.info("Received {} charge rates", chargeRates.size());
            
            // Log all data received
            if (logger.isDebugEnabled()) {
                for (int i = 0; i < chargeRates.size(); i++) {
                    ChargeRate rate = chargeRates.get(i);
                    logger.debug("Rate {}: chargeName={}, product={}, productType={}, subtype={}, rateValue={}", 
                        i, rate.getChargeName(), rate.getProduct(), rate.getProductType(), 
                        rate.getSubtype(), rate.getRateValue());
                }
            }
            
            // Save the charge rates
            List<ChargeRate> savedRates = chargeRateService.saveAllChargeRates(id, chargeRates);
            logger.info("Successfully saved {} charge rates for factory ID: {}", savedRates.size(), id);
            logger.info("==========================================================");
            
            return ResponseEntity.ok(savedRates);
        } catch (RuntimeException e) {
            logger.error("==========================================================");
            logger.error("ERROR SAVING CHARGE RATES");
            logger.error("Error saving charge rates: {}", e.getMessage(), e);
            
            // Create error response
            ErrorResponse errorResponse = new ErrorResponse();
            errorResponse.setStatus(HttpStatus.BAD_REQUEST.value());
            errorResponse.setMessage("Error saving charge rates: " + e.getMessage());
            errorResponse.setTimestamp(LocalDateTime.now());
            
            logger.error("Returning error response");
            logger.error("==========================================================");
            
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("==========================================================");
            logger.error("ERROR SAVING CHARGE RATES");
            logger.error("Error saving charge rates: {}", e.getMessage(), e);
            
            // Create error response
            ErrorResponse errorResponse = new ErrorResponse();
            errorResponse.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            errorResponse.setMessage("Error saving charge rates: " + e.getMessage());
            errorResponse.setTimestamp(LocalDateTime.now());
            
            logger.error("Returning error response");
            logger.error("==========================================================");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}/all-charge-rates")
    public ResponseEntity<List<ChargeRate>> getAllChargeRates(@PathVariable Long id) {
        try {
            logger.debug("Retrieving all charge rates for factory id: {}", id);
            List<ChargeRate> rates = chargeRateRepository.findByFactoryId(id);
            logger.debug("Retrieved {} charge rates for factory id: {}", rates.size(), id);
            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            logger.error("Error retrieving all charge rates: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PatchMapping("/{id}/properties")
    public ResponseEntity<Factory> updateFactoryProperties(
            @PathVariable @NotNull @Min(1) Long id,
            @RequestBody Map<String, Object> properties) {
        try {
            logger.info("Updating factory properties for ID: {}", id);
            logger.debug("Received properties: {}", properties);
            
            Optional<Factory> factoryOpt = factoryService.getFactoryById(id);
            if (!factoryOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Factory factory = factoryOpt.get();
            
            // Update pallet charge if provided
            if (properties.containsKey("palletCharge")) {
                Object palletChargeObj = properties.get("palletCharge");
                if (palletChargeObj != null) {
                    Double palletCharge;
                    if (palletChargeObj instanceof Double) {
                        palletCharge = (Double) palletChargeObj;
                    } else if (palletChargeObj instanceof Integer) {
                        palletCharge = ((Integer) palletChargeObj).doubleValue();
                    } else if (palletChargeObj instanceof String) {
                        palletCharge = Double.parseDouble((String) palletChargeObj);
                    } else {
                        palletCharge = 0.0;
                    }
                    factory.setPalletCharge(palletCharge);
                    logger.debug("Updated palletCharge to {}", palletCharge);
                }
            }
            
            // Update terminal charge if provided
            if (properties.containsKey("terminalCharge")) {
                Object terminalChargeObj = properties.get("terminalCharge");
                if (terminalChargeObj != null) {
                    Double terminalCharge;
                    if (terminalChargeObj instanceof Double) {
                        terminalCharge = (Double) terminalChargeObj;
                    } else if (terminalChargeObj instanceof Integer) {
                        terminalCharge = ((Integer) terminalChargeObj).doubleValue();
                    } else if (terminalChargeObj instanceof String) {
                        terminalCharge = Double.parseDouble((String) terminalChargeObj);
                    } else {
                        terminalCharge = 0.0;
                    }
                    factory.setTerminalCharge(terminalCharge);
                    logger.debug("Updated terminalCharge to {}", terminalCharge);
                }
            }
            
            // Update reception fee if provided
            if (properties.containsKey("receptionFee")) {
                Object receptionFeeObj = properties.get("receptionFee");
                if (receptionFeeObj != null) {
                    Double receptionFee;
                    if (receptionFeeObj instanceof Double) {
                        receptionFee = (Double) receptionFeeObj;
                    } else if (receptionFeeObj instanceof Integer) {
                        receptionFee = ((Integer) receptionFeeObj).doubleValue();
                    } else if (receptionFeeObj instanceof String) {
                        receptionFee = Double.parseDouble((String) receptionFeeObj);
                    } else {
                        receptionFee = 0.0;
                    }
                    factory.setReceptionFee(receptionFee);
                    logger.debug("Updated receptionFee to {}", receptionFee);
                }
            }
            
            // Update dispatch fee if provided
            if (properties.containsKey("dispatchFee")) {
                Object dispatchFeeObj = properties.get("dispatchFee");
                if (dispatchFeeObj != null) {
                    Double dispatchFee;
                    if (dispatchFeeObj instanceof Double) {
                        dispatchFee = (Double) dispatchFeeObj;
                    } else if (dispatchFeeObj instanceof Integer) {
                        dispatchFee = ((Integer) dispatchFeeObj).doubleValue();
                    } else if (dispatchFeeObj instanceof String) {
                        dispatchFee = Double.parseDouble((String) dispatchFeeObj);
                    } else {
                        dispatchFee = 0.0;
                    }
                    factory.setDispatchFee(dispatchFee);
                    logger.debug("Updated dispatchFee to {}", dispatchFee);
                }
            }
            
            // Update environmental fee percentage if provided
            if (properties.containsKey("environmentalFeePercentage")) {
                Object environmentalFeeObj = properties.get("environmentalFeePercentage");
                if (environmentalFeeObj != null) {
                    Double environmentalFee;
                    if (environmentalFeeObj instanceof Double) {
                        environmentalFee = (Double) environmentalFeeObj;
                    } else if (environmentalFeeObj instanceof Integer) {
                        environmentalFee = ((Integer) environmentalFeeObj).doubleValue();
                    } else if (environmentalFeeObj instanceof String) {
                        environmentalFee = Double.parseDouble((String) environmentalFeeObj);
                    } else {
                        environmentalFee = 0.0;
                    }
                    factory.setEnvironmentalFeePercentage(environmentalFee);
                    logger.debug("Updated environmentalFeePercentage to {}", environmentalFee);
                }
            }
            
            // Update electricity fee percentage if provided
            if (properties.containsKey("electricityFeePercentage")) {
                Object electricityFeeObj = properties.get("electricityFeePercentage");
                if (electricityFeeObj != null) {
                    Double electricityFee;
                    if (electricityFeeObj instanceof Double) {
                        electricityFee = (Double) electricityFeeObj;
                    } else if (electricityFeeObj instanceof Integer) {
                        electricityFee = ((Integer) electricityFeeObj).doubleValue();
                    } else if (electricityFeeObj instanceof String) {
                        electricityFee = Double.parseDouble((String) electricityFeeObj);
                    } else {
                        electricityFee = 0.0;
                    }
                    factory.setElectricityFeePercentage(electricityFee);
                    logger.debug("Updated electricityFeePercentage to {}", electricityFee);
                }
            }
            
            // Save the updated factory
            Factory updatedFactory = factoryService.updateFactory(factory);
            logger.info("Factory properties updated successfully");
            
            return ResponseEntity.ok(updatedFactory);
        } catch (Exception e) {
            logger.error("Error updating factory properties: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 